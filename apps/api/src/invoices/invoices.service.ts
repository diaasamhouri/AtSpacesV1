import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { UpdateInvoiceDto } from './dto/update-invoice.dto';
import { buildPaginatedResponse } from '../common/helpers/paginate';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const PDFDocument = require('pdfkit');

const invoiceInclude = {
  booking: {
    select: {
      id: true,
      startTime: true,
      endTime: true,
      branch: { select: { name: true } },
      service: { select: { name: true } },
    },
  },
  customer: { select: { name: true, email: true } },
};

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  private async getVendorProfileId(userId: string): Promise<string> {
    const vendor = await this.prisma.vendorProfile.findUnique({ where: { userId } });
    if (!vendor) throw new BadRequestException('Vendor profile not found');
    return vendor.id;
  }

  private generateInvoiceNumber(): string {
    return `INV-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
  }

  async createInvoice(userId: string, dto: CreateInvoiceDto) {
    const vendorProfileId = await this.getVendorProfileId(userId);

    // Verify the booking belongs to one of the vendor's branches
    const booking = await this.prisma.booking.findUnique({
      where: { id: dto.bookingId },
      include: { branch: { select: { vendorProfileId: true } } },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.branch.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    const invoice = await this.prisma.invoice.create({
      data: {
        invoiceNumber: this.generateInvoiceNumber(),
        bookingId: dto.bookingId,
        customerId: dto.customerId,
        amount: dto.amount,
        taxAmount: dto.taxAmount ?? 0,
        totalAmount: dto.totalAmount,
        dueDate: dto.dueDate ? new Date(dto.dueDate) : null,
      },
      include: invoiceInclude,
    });

    return this.serializeInvoice(invoice);
  }

  async getInvoices(userId: string, query: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) {
    const vendorProfileId = await this.getVendorProfileId(userId);
    const page = query.page || 1;
    const limit = query.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {
      booking: { branch: { vendorProfileId } },
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.search) {
      where.OR = [
        { invoiceNumber: { contains: query.search, mode: 'insensitive' }, booking: { branch: { vendorProfileId } } },
        { customer: { name: { contains: query.search, mode: 'insensitive' } }, booking: { branch: { vendorProfileId } } },
      ];
    }

    const [invoices, total] = await Promise.all([
      this.prisma.invoice.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: invoiceInclude,
      }),
      this.prisma.invoice.count({ where }),
    ]);

    return buildPaginatedResponse(
      invoices.map((inv) => this.serializeInvoice(inv)),
      total,
      page,
      limit,
    );
  }

  async getInvoice(userId: string, id: string) {
    const vendorProfileId = await this.getVendorProfileId(userId);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        ...invoiceInclude,
        booking: {
          select: {
            ...invoiceInclude.booking.select,
            branch: { select: { ...invoiceInclude.booking.select.branch.select, vendorProfileId: true } },
          },
        },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.booking?.branch?.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return this.serializeInvoice(invoice);
  }

  async updateInvoice(userId: string, id: string, dto: UpdateInvoiceDto) {
    const vendorProfileId = await this.getVendorProfileId(userId);

    const existing = await this.prisma.invoice.findUnique({
      where: { id },
      include: { booking: { select: { branch: { select: { vendorProfileId: true } } } } },
    });

    if (!existing) {
      throw new NotFoundException('Invoice not found');
    }

    if (existing.booking?.branch?.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    const data: any = {};

    if (dto.amount !== undefined) {
      data.amount = dto.amount;
    }

    if (dto.taxAmount !== undefined) {
      data.taxAmount = dto.taxAmount;
    }

    if (dto.totalAmount !== undefined) {
      data.totalAmount = dto.totalAmount;
    }

    if (dto.dueDate !== undefined) {
      data.dueDate = new Date(dto.dueDate);
    }

    if (dto.status !== undefined) {
      data.status = dto.status;

      if (dto.status === 'ISSUED') {
        data.issuedAt = new Date();
      }

      if (dto.status === 'PAID') {
        data.paidAt = new Date();
      }
    }

    const invoice = await this.prisma.invoice.update({
      where: { id },
      data,
      include: invoiceInclude,
    });

    return this.serializeInvoice(invoice);
  }

  async getFinancialStats(userId: string) {
    const vendorProfileId = await this.getVendorProfileId(userId);
    const now = new Date();

    // Vendor scoping filters
    const vendorInvoiceScope = { booking: { branch: { vendorProfileId } } };
    const vendorBookingScope = { branch: { vendorProfileId } };

    // Start of today (UTC)
    const todayStart = new Date(now);
    todayStart.setUTCHours(0, 0, 0, 0);

    // End of today (UTC)
    const todayEnd = new Date(now);
    todayEnd.setUTCHours(23, 59, 59, 999);

    // Next 7 days
    const next7Days = new Date(now);
    next7Days.setUTCDate(next7Days.getUTCDate() + 7);

    // Start of current month
    const monthStart = new Date(now.getUTCFullYear(), now.getUTCMonth(), 1);

    // End of current month
    const monthEnd = new Date(now.getUTCFullYear(), now.getUTCMonth() + 1, 0);
    monthEnd.setUTCHours(23, 59, 59, 999);

    // Start of current year
    const yearStart = new Date(now.getUTCFullYear(), 0, 1);

    // End of current year
    const yearEnd = new Date(now.getUTCFullYear(), 11, 31);
    yearEnd.setUTCHours(23, 59, 59, 999);

    const [
      todayPayments,
      weekForecast,
      monthForecast,
      yearForecast,
      duePayments,
      stumblingAccounts,
      invoicesTotal,
      receiptsTotal,
    ] = await Promise.all([
      // Today's payments: sum of payments with paidAt today
      this.prisma.invoice.aggregate({
        where: {
          ...vendorInvoiceScope,
          paidAt: { gte: todayStart, lte: todayEnd },
        },
        _sum: { totalAmount: true },
      }),

      // Week forecast: sum of bookings with startTime in next 7 days
      this.prisma.booking.aggregate({
        where: {
          ...vendorBookingScope,
          startTime: { gte: now, lte: next7Days },
        },
        _sum: { totalPrice: true },
      }),

      // Month forecast: sum of bookings with startTime this month
      this.prisma.booking.aggregate({
        where: {
          ...vendorBookingScope,
          startTime: { gte: monthStart, lte: monthEnd },
        },
        _sum: { totalPrice: true },
      }),

      // Year forecast: sum of bookings with startTime this year
      this.prisma.booking.aggregate({
        where: {
          ...vendorBookingScope,
          startTime: { gte: yearStart, lte: yearEnd },
        },
        _sum: { totalPrice: true },
      }),

      // Due payments: sum of invoices where status is OVERDUE
      this.prisma.invoice.aggregate({
        where: {
          ...vendorInvoiceScope,
          status: 'OVERDUE',
        },
        _sum: { totalAmount: true },
      }),

      // Stumbling accounts: count of distinct customers with OVERDUE invoices
      this.prisma.invoice.groupBy({
        by: ['customerId'],
        where: {
          ...vendorInvoiceScope,
          status: 'OVERDUE',
        },
      }),

      // Invoices total: sum of all invoice totalAmounts
      this.prisma.invoice.aggregate({
        where: vendorInvoiceScope,
        _sum: { totalAmount: true },
      }),

      // Receipts total: sum of all PAID invoice totalAmounts
      this.prisma.invoice.aggregate({
        where: {
          ...vendorInvoiceScope,
          status: 'PAID',
        },
        _sum: { totalAmount: true },
      }),
    ]);

    return {
      todayPayments: todayPayments._sum.totalAmount?.toNumber() ?? 0,
      weekForecast: weekForecast._sum.totalPrice?.toNumber() ?? 0,
      monthForecast: monthForecast._sum.totalPrice?.toNumber() ?? 0,
      yearForecast: yearForecast._sum.totalPrice?.toNumber() ?? 0,
      duePayments: duePayments._sum.totalAmount?.toNumber() ?? 0,
      stumblingAccounts: stumblingAccounts.length,
      invoicesTotal: invoicesTotal._sum.totalAmount?.toNumber() ?? 0,
      receiptsTotal: receiptsTotal._sum.totalAmount?.toNumber() ?? 0,
    };
  }

  async generatePdf(userId: string, id: string): Promise<Buffer> {
    const vendorProfileId = await this.getVendorProfileId(userId);

    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        booking: {
          select: {
            id: true,
            startTime: true,
            endTime: true,
            numberOfPeople: true,
            branch: { select: { name: true, address: true, phone: true, email: true, vendorProfileId: true } },
            service: { select: { name: true, type: true } },
          },
        },
        customer: { select: { name: true, email: true, phone: true } },
      },
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    if (invoice.booking?.branch?.vendorProfileId !== vendorProfileId) {
      throw new ForbiddenException('You do not have access to this invoice');
    }

    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ margin: 50 });
      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Header
      doc.fontSize(20).text('INVOICE', { align: 'center' });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#666').text(`Invoice #: ${invoice.invoiceNumber}`, { align: 'center' });
      doc.moveDown(1.5);

      // Branch Info
      if (invoice.booking?.branch) {
        doc.fillColor('#000').fontSize(12).text('From:', { underline: true });
        doc.fontSize(10).fillColor('#444');
        doc.text(invoice.booking.branch.name);
        if (invoice.booking.branch.address) doc.text(invoice.booking.branch.address);
        if (invoice.booking.branch.phone) doc.text(`Phone: ${invoice.booking.branch.phone}`);
        if (invoice.booking.branch.email) doc.text(`Email: ${invoice.booking.branch.email}`);
        doc.moveDown(1);
      }

      // Customer Info
      doc.fillColor('#000').fontSize(12).text('Bill To:', { underline: true });
      doc.fontSize(10).fillColor('#444');
      doc.text(invoice.customer?.name || 'N/A');
      if (invoice.customer?.email) doc.text(invoice.customer.email);
      if (invoice.customer?.phone) doc.text(invoice.customer.phone);
      doc.moveDown(1);

      // Invoice Details
      doc.fillColor('#000').fontSize(12).text('Invoice Details', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(10).fillColor('#444');

      if (invoice.booking) {
        doc.text(`Service: ${invoice.booking.service?.name || 'N/A'} (${(invoice.booking.service?.type || '').replace(/_/g, ' ')})`);
        doc.text(`Booking Period: ${invoice.booking.startTime.toLocaleDateString()} - ${invoice.booking.endTime.toLocaleDateString()}`);
        doc.text(`People: ${invoice.booking.numberOfPeople}`);
      }

      doc.text(`Status: ${invoice.status}`);
      if (invoice.issuedAt) doc.text(`Issued: ${invoice.issuedAt.toLocaleDateString()}`);
      if (invoice.dueDate) doc.text(`Due Date: ${invoice.dueDate.toLocaleDateString()}`);
      if (invoice.paidAt) doc.text(`Paid: ${invoice.paidAt.toLocaleDateString()}`);
      doc.moveDown(1.5);

      // Financial Breakdown
      doc.fillColor('#000').fontSize(12).text('Financial Breakdown', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(11);

      const lineY = doc.y;
      doc.text('Subtotal:', 50, lineY);
      doc.text(`JOD ${invoice.amount.toNumber().toFixed(2)}`, 400, lineY, { align: 'right' });

      doc.moveDown(0.3);
      const taxY = doc.y;
      doc.text('Tax:', 50, taxY);
      doc.text(`JOD ${invoice.taxAmount.toNumber().toFixed(2)}`, 400, taxY, { align: 'right' });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(545, doc.y).stroke();
      doc.moveDown(0.3);

      const totalY = doc.y;
      doc.fontSize(14).text('Total:', 50, totalY);
      doc.text(`JOD ${invoice.totalAmount.toNumber().toFixed(2)}`, 400, totalY, { align: 'right' });
      doc.moveDown(2);

      // Footer
      doc.fontSize(8).fillColor('#999').text('Thank you for your business.', { align: 'center' });
      doc.text(`Generated on ${new Date().toLocaleDateString()}`, { align: 'center' });

      doc.end();
    });
  }

  private serializeInvoice(invoice: any) {
    return {
      id: invoice.id,
      invoiceNumber: invoice.invoiceNumber,
      bookingId: invoice.bookingId,
      customerId: invoice.customerId,
      amount: invoice.amount.toNumber(),
      taxAmount: invoice.taxAmount.toNumber(),
      totalAmount: invoice.totalAmount.toNumber(),
      status: invoice.status,
      issuedAt: invoice.issuedAt?.toISOString() ?? null,
      dueDate: invoice.dueDate?.toISOString() ?? null,
      paidAt: invoice.paidAt?.toISOString() ?? null,
      createdAt: invoice.createdAt.toISOString(),
      updatedAt: invoice.updatedAt.toISOString(),
      booking: invoice.booking ?? null,
      customer: invoice.customer ?? null,
    };
  }
}
