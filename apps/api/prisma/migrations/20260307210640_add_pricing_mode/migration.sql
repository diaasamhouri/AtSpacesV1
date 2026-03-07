-- CreateEnum
CREATE TYPE "PricingMode" AS ENUM ('PER_BOOKING', 'PER_PERSON', 'PER_HOUR');

-- AlterTable
ALTER TABLE "ServicePricing" ADD COLUMN     "pricingMode" "PricingMode" NOT NULL DEFAULT 'PER_BOOKING';
