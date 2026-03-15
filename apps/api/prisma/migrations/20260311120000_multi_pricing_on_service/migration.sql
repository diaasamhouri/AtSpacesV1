-- AlterTable: Replace price + pricingMode with three optional price columns
ALTER TABLE "Service" DROP COLUMN "price",
DROP COLUMN "pricingMode";

ALTER TABLE "Service" ADD COLUMN "pricePerBooking" DECIMAL(10,3),
ADD COLUMN "pricePerPerson" DECIMAL(10,3),
ADD COLUMN "pricePerHour" DECIMAL(10,3);
