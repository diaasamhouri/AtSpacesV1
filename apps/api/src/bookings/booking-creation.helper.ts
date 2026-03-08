import { BadRequestException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * Validates a promo code for a given branch/vendor scope.
 * Returns the promo code record and computed discount info, or throws on invalid codes.
 */
export async function validatePromoCode(
  prisma: PrismaService,
  code: string,
  vendorProfileId: string,
  branchId: string,
  subtotal: number,
): Promise<{
  promoCodeRecord: any;
  discountType: string;
  discountValue: number;
  discountAmount: number;
  promoCodeId: string;
}> {
  const promoCodeRecord = await prisma.promoCode.findFirst({
    where: {
      code: code.toUpperCase(),
      isActive: true,
      OR: [
        { branchId },
        { branchId: null, vendorProfileId },
      ],
    },
  });

  if (!promoCodeRecord) {
    throw new BadRequestException('Invalid or inactive promo code');
  }

  if (promoCodeRecord.validUntil && new Date() > promoCodeRecord.validUntil) {
    throw new BadRequestException('Promo code has expired');
  }

  if (promoCodeRecord.maxUses > 0 && promoCodeRecord.currentUses >= promoCodeRecord.maxUses) {
    throw new BadRequestException('Promo code usage limit reached');
  }

  const discountValue = promoCodeRecord.discountPercent;
  const discountAmount = (subtotal * discountValue) / 100;

  return {
    promoCodeRecord,
    discountType: 'PROMO_CODE',
    discountValue,
    discountAmount,
    promoCodeId: promoCodeRecord.id,
  };
}

/**
 * Calculates the subtotal based on the pricing mode.
 *
 * @param unitPrice    - The base price per unit
 * @param pricingMode  - PER_BOOKING, PER_PERSON, or PER_HOUR
 * @param numberOfPeople - Number of people for PER_PERSON mode
 * @param durationHours  - Duration in hours for PER_HOUR mode
 */
export function calculateSubtotal(
  unitPrice: number,
  pricingMode: string,
  numberOfPeople: number,
  durationHours: number,
): number {
  if (pricingMode === 'PER_PERSON') {
    return unitPrice * numberOfPeople;
  }
  if (pricingMode === 'PER_HOUR') {
    return unitPrice * durationHours;
  }
  return unitPrice;
}

/**
 * Checks slot availability by counting overlapping active bookings.
 * Throws ConflictException if the slot is fully booked.
 *
 * @returns The number of overlapping bookings
 */
export async function checkSlotAvailability(
  prisma: PrismaService,
  serviceId: string,
  startTime: Date,
  endTime: Date,
  capacity: number,
  errorMessage = 'No availability for the selected time slot',
): Promise<number> {
  const overlappingCount = await prisma.booking.count({
    where: {
      serviceId,
      status: { in: ['PENDING', 'CONFIRMED', 'CHECKED_IN'] },
      startTime: { lt: endTime },
      endTime: { gt: startTime },
    },
  });

  if (overlappingCount >= capacity) {
    throw new ConflictException(errorMessage);
  }

  return overlappingCount;
}

/**
 * Fetches the vendor profile's tax settings and calculates tax amount.
 *
 * @param prisma           - PrismaService instance
 * @param vendorProfileId  - The vendor profile ID
 * @param afterDiscount    - The amount after discount has been applied
 * @returns { taxRate, taxAmount }
 */
export async function calculateTaxFromVendorProfile(
  prisma: PrismaService,
  vendorProfileId: string,
  afterDiscount: number,
): Promise<{ taxRate: number | null; taxAmount: number }> {
  const vendorProfile = await prisma.vendorProfile.findUnique({
    where: { id: vendorProfileId },
    select: { taxRate: true, taxEnabled: true },
  });

  let taxRate: number | null = null;
  let taxAmount = 0;

  if (vendorProfile?.taxEnabled) {
    taxRate = (vendorProfile.taxRate as any).toNumber?.() ?? Number(vendorProfile.taxRate);
    taxAmount = (afterDiscount * taxRate!) / 100;
  }

  return { taxRate, taxAmount };
}
