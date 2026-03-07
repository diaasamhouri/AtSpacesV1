-- CreateEnum
CREATE TYPE "DiscountType" AS ENUM ('NONE', 'PERCENTAGE', 'FIXED', 'PROMO_CODE');

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "bookingGroupId" TEXT,
ADD COLUMN     "discountAmount" DECIMAL(10,3),
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" DECIMAL(10,3),
ADD COLUMN     "pricingInterval" "PricingInterval",
ADD COLUMN     "promoCodeId" TEXT,
ADD COLUMN     "subtotal" DECIMAL(10,3),
ADD COLUMN     "taxAmount" DECIMAL(10,3),
ADD COLUMN     "taxRate" DECIMAL(5,2),
ADD COLUMN     "unitPrice" DECIMAL(10,3);

-- AlterTable
ALTER TABLE "Quotation" ADD COLUMN     "discountAmount" DECIMAL(10,3),
ADD COLUMN     "discountType" "DiscountType" NOT NULL DEFAULT 'NONE',
ADD COLUMN     "discountValue" DECIMAL(10,3),
ADD COLUMN     "subtotal" DECIMAL(10,3),
ADD COLUMN     "taxAmount" DECIMAL(10,3),
ADD COLUMN     "taxRate" DECIMAL(5,2);

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "taxEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 16.00;

-- CreateTable
CREATE TABLE "VendorAddOn" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "nameAr" TEXT,
    "unitPrice" DECIMAL(10,3) NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'JOD',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VendorAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BookingAddOn" (
    "id" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "vendorAddOnId" TEXT,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,3) NOT NULL,
    "serviceTime" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BookingAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuotationLineItem" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,3) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationLineItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VendorAddOn_vendorProfileId_idx" ON "VendorAddOn"("vendorProfileId");

-- CreateIndex
CREATE INDEX "BookingAddOn_bookingId_idx" ON "BookingAddOn"("bookingId");

-- CreateIndex
CREATE INDEX "QuotationLineItem_quotationId_idx" ON "QuotationLineItem"("quotationId");

-- CreateIndex
CREATE INDEX "Booking_bookingGroupId_idx" ON "Booking"("bookingGroupId");

-- AddForeignKey
ALTER TABLE "Booking" ADD CONSTRAINT "Booking_promoCodeId_fkey" FOREIGN KEY ("promoCodeId") REFERENCES "PromoCode"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VendorAddOn" ADD CONSTRAINT "VendorAddOn_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BookingAddOn" ADD CONSTRAINT "BookingAddOn_vendorAddOnId_fkey" FOREIGN KEY ("vendorAddOnId") REFERENCES "VendorAddOn"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationLineItem" ADD CONSTRAINT "QuotationLineItem_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
