import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateQuotationDto, UpdateQuotationDto } from './dto';
import { buildPaginatedResponse } from '../common/helpers/paginate';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const quotationInclude = {
  customer: { select: { name: true, email: true } },
  branch: { select: { name: true } },
  service: { select: { name: true, type: true } },
  createdBy: { select: { name: true } },
  lineItems: { orderBy: { sortOrder: 'asc' as const } },
  addOns: true,
};

@Injectable()
export class QuotationsService {
  constructor(private prisma: PrismaService) {}

  async createQuotation(userId: string, dto: CreateQuotationDto) {
    if (dto.serviceId) {
      const service = await this.prisma.service.findUnique({ where: { id: dto.serviceId } });
      if (service && !service.isActive) {
        throw new BadRequestException('Service is not active');
      }
    }

    const referenceNumber = `QT-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

    const quotation = await this.prisma.quotation.create({
      data: {
        referenceNumber,
        customerId: dto.customerId,
        branchId: dto.branchId,
        serviceId: dto.serviceId,
        startTime: new Date(dto.startTime),
        endTime: new Date(dto.endTime),
        numberOfPeople: dto.numberOfPeople ?? 1,
        totalAmount: dto.totalAmount,
        notes: dto.notes,
        createdById: userId,
        subtotal: dto.subtotal,
        discountType: dto.discountType,
        discountValue: dto.discountValue,
        discountAmount: dto.discountAmount,
        taxRate: dto.taxRate,
        taxAmount: dto.taxAmount,
        pricingInterval: dto.pricingInterval,
        pricingMode: dto.pricingMode,
        ...(dto.lineItems?.length
          ? {
              lineItems: {
                create: dto.lineItems.map((item, index) => ({
                  description: item.description,
                  unitPrice: item.unitPrice,
                  quantity: item.quantity ?? 1,
                  totalPrice: item.totalPrice,
                  sortOrder: item.sortOrder ?? index,
                })),
              },
            }
          : {}),
      },
      include: quotationInclude,
    });

    // Create add-ons if provided
    if (dto.addOns?.length) {
      for (const addOn of dto.addOns) {
        const vendorAddOn = await this.prisma.vendorAddOn.findUnique({
          where: { id: addOn.vendorAddOnId },
        });
        if (!vendorAddOn) {
          throw new NotFoundException(`VendorAddOn ${addOn.vendorAddOnId} not found`);
        }
        const quantity = addOn.quantity ?? 1;
        await this.prisma.quotationAddOn.create({
          data: {
            quotationId: quotation.id,
            vendorAddOnId: vendorAddOn.id,
            name: vendorAddOn.name,
            unitPrice: vendorAddOn.unitPrice,
            quantity,
            totalPrice: vendorAddOn.unitPrice.toNumber() * quantity,
            serviceTime: addOn.serviceTime,
            comments: addOn.comments,
          },
        });
      }

      // Re-fetch to include the newly created add-ons
      const refreshed = await this.prisma.quotation.findUnique({
        where: { id: quotation.id },
        include: quotationInclude,
      });
      return this.serializeQuotation(refreshed);
    }

    return this.serializeQuotation(quotation);
  }

  async getQuotations(
    userId: string,
    query: {
      page?: number;
      limit?: number;
      status?: string;
      search?: string;
      branchId?: string;
    } = {},
  ) {
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile) {
      throw new NotFoundException('Vendor profile not found');
    }

    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      branch: { vendorProfileId: vendorProfile.id },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.customer = {
        name: { contains: query.search, mode: 'insensitive' },
      };
    }

    if (query.branchId) {
      where.branchId = query.branchId;
    }

    const [quotations, total] = await Promise.all([
      this.prisma.quotation.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: quotationInclude,
      }),
      this.prisma.quotation.count({ where }),
    ]);

    return buildPaginatedResponse(
      quotations.map((q) => this.serializeQuotation(q)),
      total,
      page,
      limit,
    );
  }

  async getQuotation(userId: string, id: string) {
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        ...quotationInclude,
        branch: { select: { name: true, vendorProfileId: true } },
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // Verify ownership: user must be the vendor who owns the branch
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { userId },
    });

    if (!vendorProfile || quotation.branch.vendorProfileId !== vendorProfile.id) {
      throw new NotFoundException('Quotation not found');
    }

    return this.serializeQuotation({
      ...quotation,
      branch: { name: quotation.branch.name },
    });
  }

  async acceptQuotation(userId: string, id: string) {
    const quotation = await this.verifyQuotationOwnership(userId, id);
    if (quotation.status !== 'SENT') {
      throw new BadRequestException('Only sent quotations can be accepted');
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'ACCEPTED' },
      include: quotationInclude,
    });
    return this.serializeQuotation(updated);
  }

  async rejectQuotation(userId: string, id: string) {
    const quotation = await this.verifyQuotationOwnership(userId, id);
    if (quotation.status !== 'SENT') {
      throw new BadRequestException('Only sent quotations can be rejected');
    }

    const updated = await this.prisma.quotation.update({
      where: { id },
      data: { status: 'REJECTED' },
      include: quotationInclude,
    });
    return this.serializeQuotation(updated);
  }

  async updateQuotation(userId: string, id: string, dto: UpdateQuotationDto) {
    await this.verifyQuotationOwnership(userId, id);
    // Prevent arbitrary status changes through update — use dedicated accept/reject/send endpoints
    if (dto.status) {
      throw new BadRequestException('Use the dedicated /accept, /reject, or /send endpoints to change quotation status');
    }

    const { lineItems, addOns, ...rest } = dto;
    const data: any = { ...rest };

    if (dto.startTime) {
      data.startTime = new Date(dto.startTime);
    }
    if (dto.endTime) {
      data.endTime = new Date(dto.endTime);
    }

    // Remove lineItems and addOns from data since we handle them separately
    delete data.lineItems;
    delete data.addOns;

    if (lineItems) {
      // Delete existing line items and recreate
      await this.prisma.quotationLineItem.deleteMany({
        where: { quotationId: id },
      });

      data.lineItems = {
        create: lineItems.map((item, index) => ({
          description: item.description,
          unitPrice: item.unitPrice,
          quantity: item.quantity ?? 1,
          totalPrice: item.totalPrice,
          sortOrder: item.sortOrder ?? index,
        })),
      };
    }

    // Handle add-ons: delete and recreate if provided
    if (addOns !== undefined) {
      await this.prisma.quotationAddOn.deleteMany({
        where: { quotationId: id },
      });

      if (addOns.length) {
        for (const addOn of addOns) {
          const vendorAddOn = await this.prisma.vendorAddOn.findUnique({
            where: { id: addOn.vendorAddOnId },
          });
          if (!vendorAddOn) {
            throw new NotFoundException(`VendorAddOn ${addOn.vendorAddOnId} not found`);
          }
          const quantity = addOn.quantity ?? 1;
          await this.prisma.quotationAddOn.create({
            data: {
              quotationId: id,
              vendorAddOnId: vendorAddOn.id,
              name: vendorAddOn.name,
              unitPrice: vendorAddOn.unitPrice,
              quantity,
              totalPrice: vendorAddOn.unitPrice.toNumber() * quantity,
              serviceTime: addOn.serviceTime,
              comments: addOn.comments,
            },
          });
        }
      }
    }

    const quotation = await this.prisma.quotation.update({
      where: { id },
      data,
      include: quotationInclude,
    });

    return this.serializeQuotation(quotation);
  }

  async sendQuotation(userId: string, id: string) {
    await this.verifyQuotationOwnership(userId, id);
    const quotation = await this.prisma.quotation.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
      },
      include: quotationInclude,
    });

    return this.serializeQuotation(quotation);
  }

  async convertToBooking(userId: string, id: string) {
    const quotation = await this.verifyQuotationOwnership(userId, id);

    if (quotation.status !== 'ACCEPTED') {
      throw new BadRequestException(
        'Only accepted quotations can be converted to bookings',
      );
    }

    const booking = await this.prisma.booking.create({
      data: {
        userId: quotation.customerId,
        branchId: quotation.branchId,
        serviceId: quotation.serviceId,
        startTime: quotation.startTime,
        endTime: quotation.endTime,
        numberOfPeople: quotation.numberOfPeople,
        totalPrice: quotation.totalAmount,
        status: 'CONFIRMED',
      },
      include: {
        branch: {
          select: { id: true, name: true, city: true, address: true },
        },
        service: { select: { id: true, type: true, name: true } },
        payment: true,
      },
    });

    // Transfer quotation add-ons to booking add-ons
    const quotationWithAddOns = await this.prisma.quotation.findUnique({
      where: { id },
      include: { addOns: true },
    });

    if (quotationWithAddOns?.addOns && quotationWithAddOns.addOns.length > 0) {
      for (const addOn of quotationWithAddOns.addOns) {
        await this.prisma.bookingAddOn.create({
          data: {
            bookingId: booking.id,
            vendorAddOnId: addOn.vendorAddOnId,
            name: addOn.name,
            unitPrice: addOn.unitPrice,
            quantity: addOn.quantity,
            totalPrice: addOn.totalPrice,
            serviceTime: addOn.serviceTime,
            comments: addOn.comments,
          },
        });
      }
    }

    // Link the booking to the quotation
    await this.prisma.quotation.update({
      where: { id },
      data: { bookingId: booking.id },
    });

    return {
      id: booking.id,
      status: booking.status,
      startTime: booking.startTime.toISOString(),
      endTime: booking.endTime.toISOString(),
      numberOfPeople: booking.numberOfPeople,
      totalPrice: booking.totalPrice.toNumber(),
      currency: booking.currency,
      notes: booking.notes,
      createdAt: booking.createdAt.toISOString(),
      branch: booking.branch,
      service: booking.service,
      payment: booking.payment,
    };
  }

  async generatePdf(userId: string, id: string): Promise<Buffer> {
    await this.verifyQuotationOwnership(userId, id);
    const quotation = await this.prisma.quotation.findUnique({
      where: { id },
      include: {
        ...quotationInclude,
        branch: {
          select: {
            name: true,
            address: true,
            city: true,
            phone: true,
            email: true,
            vendorProfileId: true,
          },
        },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!quotation) {
      throw new NotFoundException('Quotation not found');
    }

    // Fetch vendor profile for company info / logo
    const vendorProfile = await this.prisma.vendorProfile.findUnique({
      where: { id: quotation.branch.vendorProfileId },
      select: { companyName: true, companyLegalName: true, companySalesTaxNumber: true, logo: true, phone: true },
    });

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('QUOTATION', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Reference: ${quotation.referenceNumber}`, { align: 'center' });
      doc.moveDown(1.5);

      // Company / Vendor Info
      if (vendorProfile?.companyName) {
        doc.fillColor('#000').fontSize(14).text(vendorProfile.companyName);
      }
      doc.fillColor('#000').fontSize(12).text(quotation.branch.name, { underline: true });
      if (quotation.branch.address) doc.fontSize(9).fillColor('#444').text(quotation.branch.address);
      if (quotation.branch.phone) doc.text(`Phone: ${quotation.branch.phone}`);
      if (quotation.branch.email) doc.text(`Email: ${quotation.branch.email}`);
      if (vendorProfile?.phone && vendorProfile.phone !== quotation.branch.phone) {
        doc.text(`Company Phone: ${vendorProfile.phone}`);
      }
      if (vendorProfile?.companyLegalName) {
        doc.text(`Legal Name: ${vendorProfile.companyLegalName}`);
      }
      if (vendorProfile?.companySalesTaxNumber) {
        doc.text(`Tax Number: ${vendorProfile.companySalesTaxNumber}`);
      }
      doc.moveDown(1);

      // Customer Info
      doc.fillColor('#000').fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).fillColor('#444');
      doc.text(quotation.customer.name || 'N/A');
      doc.text(quotation.customer.email || 'N/A');
      doc.moveDown(1);

      // Quotation Details
      doc.fillColor('#000').fontSize(12).text('Details', { underline: true });
      doc.moveDown(0.5);

      const details = [
        ['Service', `${quotation.service.name} (${quotation.service.type.replace(/_/g, ' ')})`],
        ['Date', `${quotation.startTime.toLocaleDateString()} - ${quotation.endTime.toLocaleDateString()}`],
        ['Time', `${quotation.startTime.toLocaleTimeString()} - ${quotation.endTime.toLocaleTimeString()}`],
        ['Number of People', String(quotation.numberOfPeople)],
        ['Status', quotation.status.replace(/_/g, ' ')],
      ];

      doc.fontSize(10).fillColor('#444');
      for (const [label, value] of details) {
        doc.text(`${label}: `, { continued: true }).fillColor('#000').text(value!);
        doc.fillColor('#444');
      }
      doc.moveDown(1);

      // Line Items Table
      if (quotation.lineItems && quotation.lineItems.length > 0) {
        doc.fillColor('#000').fontSize(12).text('Line Items', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50;   // Description
        const col2 = 300;  // Unit Price
        const col3 = 380;  // Qty
        const col4 = 430;  // Total

        // Table header
        doc.fontSize(9).fillColor('#000');
        doc.text('Description', col1, tableTop, { width: 240 });
        doc.text('Unit Price', col2, tableTop, { width: 70, align: 'right' });
        doc.text('Qty', col3, tableTop, { width: 40, align: 'right' });
        doc.text('Total', col4, tableTop, { width: 80, align: 'right' });

        doc.moveTo(col1, tableTop + 14).lineTo(510, tableTop + 14).strokeColor('#ccc').stroke();

        let yPos = tableTop + 20;
        doc.fontSize(9).fillColor('#444');

        for (const item of quotation.lineItems) {
          const unitPrice = item.unitPrice.toNumber().toFixed(2);
          const totalPrice = item.totalPrice.toNumber().toFixed(2);

          doc.text(item.description, col1, yPos, { width: 240 });
          doc.text(`JOD ${unitPrice}`, col2, yPos, { width: 70, align: 'right' });
          doc.text(String(item.quantity), col3, yPos, { width: 40, align: 'right' });
          doc.text(`JOD ${totalPrice}`, col4, yPos, { width: 80, align: 'right' });

          yPos += 16;
        }

        // Render add-on rows in the same table after line items
        if (quotation.addOns && quotation.addOns.length > 0) {
          for (const addOn of quotation.addOns) {
            yPos += 4;
            if (yPos > 700) {
              doc.addPage();
              yPos = 50;
            }
            const addOnUnitPrice = addOn.unitPrice.toNumber().toFixed(3);
            const addOnTotalPrice = addOn.totalPrice.toNumber().toFixed(3);

            doc.text(addOn.name, col1, yPos, { width: 240 });
            doc.text(`JOD ${addOnUnitPrice}`, col2, yPos, { width: 70, align: 'right' });
            doc.text(String(addOn.quantity), col3, yPos, { width: 40, align: 'right' });
            doc.text(`JOD ${addOnTotalPrice}`, col4, yPos, { width: 80, align: 'right' });

            yPos += 16;
          }
        }

        doc.moveTo(col1, yPos).lineTo(510, yPos).strokeColor('#ccc').stroke();
        doc.y = yPos + 10;
        doc.moveDown(0.5);
      } else if (quotation.addOns && quotation.addOns.length > 0) {
        // Render add-ons table even when there are no line items
        doc.fillColor('#000').fontSize(12).text('Add-Ons', { underline: true });
        doc.moveDown(0.5);

        const tableTop = doc.y;
        const col1 = 50;
        const col2 = 300;
        const col3 = 380;
        const col4 = 430;

        doc.fontSize(9).fillColor('#000');
        doc.text('Description', col1, tableTop, { width: 240 });
        doc.text('Unit Price', col2, tableTop, { width: 70, align: 'right' });
        doc.text('Qty', col3, tableTop, { width: 40, align: 'right' });
        doc.text('Total', col4, tableTop, { width: 80, align: 'right' });

        doc.moveTo(col1, tableTop + 14).lineTo(510, tableTop + 14).strokeColor('#ccc').stroke();

        let yPos = tableTop + 20;
        doc.fontSize(9).fillColor('#444');

        for (const addOn of quotation.addOns) {
          if (yPos > 700) {
            doc.addPage();
            yPos = 50;
          }
          const addOnUnitPrice = addOn.unitPrice.toNumber().toFixed(3);
          const addOnTotalPrice = addOn.totalPrice.toNumber().toFixed(3);

          doc.text(addOn.name, col1, yPos, { width: 240 });
          doc.text(`JOD ${addOnUnitPrice}`, col2, yPos, { width: 70, align: 'right' });
          doc.text(String(addOn.quantity), col3, yPos, { width: 40, align: 'right' });
          doc.text(`JOD ${addOnTotalPrice}`, col4, yPos, { width: 80, align: 'right' });

          yPos += 16;
        }

        doc.moveTo(col1, yPos).lineTo(510, yPos).strokeColor('#ccc').stroke();
        doc.y = yPos + 10;
        doc.moveDown(0.5);
      }

      // Financial Summary
      const summaryX = 350;
      const summaryValueX = 430;

      if (quotation.subtotal) {
        doc.fontSize(10).fillColor('#444');
        doc.text('Subtotal:', summaryX, doc.y, { continued: true, width: 80, align: 'right' });
        doc.fillColor('#000').text(`  JOD ${quotation.subtotal.toNumber().toFixed(2)}`, { align: 'right' });
      }

      if (quotation.discountAmount && quotation.discountAmount.toNumber() > 0) {
        const discountLabel =
          quotation.discountType === 'PERCENTAGE'
            ? `Discount (${quotation.discountValue?.toNumber() ?? 0}%)`
            : 'Discount';
        doc.fontSize(10).fillColor('#444');
        doc.text(`${discountLabel}:`, summaryX, doc.y, { continued: true, width: 80, align: 'right' });
        doc.fillColor('#c00').text(`  -JOD ${quotation.discountAmount.toNumber().toFixed(2)}`, { align: 'right' });
      }

      if (quotation.taxAmount && quotation.taxAmount.toNumber() > 0) {
        const taxLabel = quotation.taxRate ? `Tax (${quotation.taxRate.toNumber()}%)` : 'Tax';
        doc.fontSize(10).fillColor('#444');
        doc.text(`${taxLabel}:`, summaryX, doc.y, { continued: true, width: 80, align: 'right' });
        doc.fillColor('#000').text(`  JOD ${quotation.taxAmount.toNumber().toFixed(2)}`, { align: 'right' });
      }

      doc.moveDown(0.5);
      doc.fontSize(14).fillColor('#000').text(`Total Amount: JOD ${quotation.totalAmount.toNumber().toFixed(2)}`, { align: 'right' });
      doc.moveDown(1);

      // Notes
      if (quotation.notes) {
        doc.fontSize(12).text('Notes:', { underline: true });
        doc.fontSize(10).fillColor('#444').text(quotation.notes);
        doc.moveDown(1);
      }

      // Footer
      doc.moveDown(2);
      doc.fontSize(8).fillColor('#999').text('This quotation is valid for 30 days from the date of issue.', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.end();
    });
  }

  private async verifyQuotationOwnership(userId: string, quotationId: string) {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new BadRequestException('Vendor profile not found');
    const quotation = await this.prisma.quotation.findUnique({
      where: { id: quotationId },
      include: { branch: { select: { vendorProfileId: true } } },
    });
    if (!quotation) throw new NotFoundException('Quotation not found');
    if (quotation.branch.vendorProfileId !== vendor.id) throw new ForbiddenException('Not your quotation');
    return quotation;
  }

  private serializeQuotation(quotation: any) {
    return {
      id: quotation.id,
      referenceNumber: quotation.referenceNumber,
      customerId: quotation.customerId,
      branchId: quotation.branchId,
      serviceId: quotation.serviceId,
      startTime: quotation.startTime.toISOString(),
      endTime: quotation.endTime.toISOString(),
      numberOfPeople: quotation.numberOfPeople,
      totalAmount: quotation.totalAmount.toNumber(),
      status: quotation.status,
      notes: quotation.notes,
      subtotal: quotation.subtotal?.toNumber() ?? null,
      discountType: quotation.discountType,
      discountValue: quotation.discountValue?.toNumber() ?? null,
      discountAmount: quotation.discountAmount?.toNumber() ?? null,
      taxRate: quotation.taxRate?.toNumber() ?? null,
      taxAmount: quotation.taxAmount?.toNumber() ?? null,
      pricingInterval: quotation.pricingInterval ?? null,
      pricingMode: quotation.pricingMode ?? null,
      sentAt: quotation.sentAt?.toISOString() ?? null,
      bookingId: quotation.bookingId,
      createdAt: quotation.createdAt.toISOString(),
      updatedAt: quotation.updatedAt.toISOString(),
      customer: quotation.customer,
      branch: quotation.branch,
      service: quotation.service,
      createdBy: quotation.createdBy,
      lineItems: quotation.lineItems?.map((item: any) => ({
        id: item.id,
        description: item.description,
        unitPrice: item.unitPrice.toNumber(),
        quantity: item.quantity,
        totalPrice: item.totalPrice.toNumber(),
        sortOrder: item.sortOrder,
      })) ?? [],
      addOns: quotation.addOns?.map((a: any) => ({
        id: a.id,
        vendorAddOnId: a.vendorAddOnId,
        name: a.name,
        unitPrice: a.unitPrice.toNumber(),
        quantity: a.quantity,
        totalPrice: a.totalPrice.toNumber(),
        serviceTime: a.serviceTime ?? null,
        comments: a.comments ?? null,
      })) ?? [],
    };
  }
}
