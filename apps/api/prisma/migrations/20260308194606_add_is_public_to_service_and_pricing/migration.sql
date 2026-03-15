-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;

-- AlterTable
ALTER TABLE "ServicePricing" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT true;
