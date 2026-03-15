-- DropForeignKey
ALTER TABLE "ServicePricing" DROP CONSTRAINT "ServicePricing_serviceId_fkey";

-- AlterTable: Add new columns to Service with defaults for existing rows
ALTER TABLE "Service" ADD COLUMN "currency" TEXT NOT NULL DEFAULT 'JOD',
ADD COLUMN "price" DECIMAL(10,3) NOT NULL DEFAULT 0,
ADD COLUMN "pricingMode" "PricingMode" NOT NULL DEFAULT 'PER_BOOKING';

-- Backfill price and pricingMode from ServicePricing (use first pricing row per service)
UPDATE "Service" s
SET "price" = sp."price",
    "pricingMode" = sp."pricingMode"
FROM (
  SELECT DISTINCT ON ("serviceId") "serviceId", "price", "pricingMode"
  FROM "ServicePricing"
  ORDER BY "serviceId", "createdAt" ASC
) sp
WHERE s."id" = sp."serviceId";

-- Remove the default on price now that existing rows are populated
ALTER TABLE "Service" ALTER COLUMN "price" DROP DEFAULT;

-- AlterTable
ALTER TABLE "Booking" DROP COLUMN "pricingInterval";

-- AlterTable
ALTER TABLE "Quotation" DROP COLUMN "pricingInterval";

-- DropTable
DROP TABLE "ServicePricing";

-- DropEnum
DROP TYPE "PricingInterval";
