-- AlterEnum
ALTER TYPE "ServiceType" ADD VALUE 'EVENT_SPACE';

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "agreedToTermsAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT;
