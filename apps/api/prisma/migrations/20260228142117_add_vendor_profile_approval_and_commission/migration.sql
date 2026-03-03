-- AlterTable
ALTER TABLE "ApprovalRequest" ADD COLUMN     "vendorProfileId" TEXT,
ALTER COLUMN "branchId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "commissionRate" DOUBLE PRECISION;

-- CreateIndex
CREATE INDEX "ApprovalRequest_vendorProfileId_idx" ON "ApprovalRequest"("vendorProfileId");

-- AddForeignKey
ALTER TABLE "ApprovalRequest" ADD CONSTRAINT "ApprovalRequest_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
