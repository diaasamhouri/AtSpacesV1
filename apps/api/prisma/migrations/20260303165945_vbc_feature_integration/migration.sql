-- CreateEnum
CREATE TYPE "QuotationStatus" AS ENUM ('NOT_SENT', 'SENT', 'ACCEPTED', 'REJECTED');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "EntityType" AS ENUM ('COMPANY', 'INDIVIDUAL');

-- CreateEnum
CREATE TYPE "Gender" AS ENUM ('MALE', 'FEMALE');

-- CreateEnum
CREATE TYPE "LegalDocType" AS ENUM ('NATIONAL_ID', 'PASSPORT');

-- CreateEnum
CREATE TYPE "CustomerClassification" AS ENUM ('LEVEL_0', 'LEVEL_1', 'LEVEL_2', 'LEVEL_3', 'LEVEL_4', 'LEVEL_5', 'LEVEL_6');

-- CreateEnum
CREATE TYPE "EntityRoleName" AS ENUM ('OPERATOR', 'LESSOR', 'OWNER', 'EMPLOYEE', 'MAINTENANCE', 'RECEPTION', 'TENANT', 'LEGAL', 'BOOKING', 'CUSTOMER_CARE');

-- CreateEnum
CREATE TYPE "DepartmentType" AS ENUM ('FINANCE', 'LEGAL', 'OPERATIONS', 'MARKETING', 'HR', 'IT', 'SALES', 'CUSTOMER_SERVICE');

-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "BookingStatus" ADD VALUE 'REJECTED';
ALTER TYPE "BookingStatus" ADD VALUE 'EXPIRED';

-- DropForeignKey
ALTER TABLE "AdminAuditLog" DROP CONSTRAINT "AdminAuditLog_adminId_fkey";

-- AlterTable
ALTER TABLE "Booking" ADD COLUMN     "accountantApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "archivedAt" TIMESTAMP(3),
ADD COLUMN     "salesApproved" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "grossArea" DECIMAL(10,2),
ADD COLUMN     "profileUrl" TEXT,
ADD COLUMN     "receptionEmail" TEXT,
ADD COLUMN     "receptionMobile" TEXT;

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "floor" TEXT,
ADD COLUMN     "netSize" DECIMAL(10,2),
ADD COLUMN     "profileNameAr" TEXT,
ADD COLUMN     "profileNameEn" TEXT,
ADD COLUMN     "weight" INTEGER;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "alternativeMobile" TEXT,
ADD COLUMN     "customerClassification" "CustomerClassification",
ADD COLUMN     "entityType" "EntityType",
ADD COLUMN     "gender" "Gender",
ADD COLUMN     "legalDocNumber" TEXT,
ADD COLUMN     "legalDocType" "LegalDocType",
ADD COLUMN     "nationality" TEXT,
ADD COLUMN     "preferredLanguage" TEXT DEFAULT 'en';

-- AlterTable
ALTER TABLE "VendorProfile" ADD COLUMN     "companyDescription" TEXT,
ADD COLUMN     "companyLegalName" TEXT,
ADD COLUMN     "companyNationalId" TEXT,
ADD COLUMN     "companyRegistrationDate" TIMESTAMP(3),
ADD COLUMN     "companyRegistrationNumber" TEXT,
ADD COLUMN     "companySalesTaxNumber" TEXT,
ADD COLUMN     "companyShortName" TEXT,
ADD COLUMN     "companyTradeName" TEXT,
ADD COLUMN     "hasTaxExemption" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "registeredInCountry" TEXT;

-- CreateTable
CREATE TABLE "Quotation" (
    "id" TEXT NOT NULL,
    "referenceNumber" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "branchId" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3) NOT NULL,
    "numberOfPeople" INTEGER NOT NULL DEFAULT 1,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "QuotationStatus" NOT NULL DEFAULT 'NOT_SENT',
    "notes" TEXT,
    "sentAt" TIMESTAMP(3),
    "createdById" TEXT NOT NULL,
    "bookingId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quotation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "invoiceNumber" TEXT NOT NULL,
    "bookingId" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "taxAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "totalAmount" DECIMAL(10,2) NOT NULL,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issuedAt" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "EntityRole" (
    "id" TEXT NOT NULL,
    "name" "EntityRoleName" NOT NULL,

    CONSTRAINT "EntityRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserEntityRole" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "entityRoleId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UserEntityRole_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AuthorizedSignatory" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "fullName" TEXT NOT NULL,
    "nationality" TEXT,
    "legalDocType" "LegalDocType",
    "legalDocNumber" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "gender" "Gender",
    "idFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AuthorizedSignatory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CompanyContact" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "contactPersonName" TEXT,
    "mobile" TEXT,
    "email" TEXT,
    "website" TEXT,
    "phone" TEXT,
    "fax" TEXT,
    "logoUrl" TEXT,
    "profileFileUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CompanyContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DepartmentContact" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "department" "DepartmentType" NOT NULL,
    "contactName" TEXT,
    "mobile" TEXT,
    "phone" TEXT,
    "email" TEXT,
    "fax" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DepartmentContact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BankingInfo" (
    "id" TEXT NOT NULL,
    "vendorProfileId" TEXT NOT NULL,
    "bankName" TEXT,
    "bankBranch" TEXT,
    "accountNumber" TEXT,
    "iban" TEXT,
    "swiftCode" TEXT,
    "accountantManagerName" TEXT,
    "cliq" TEXT,
    "signatureUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "BankingInfo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_referenceNumber_key" ON "Quotation"("referenceNumber");

-- CreateIndex
CREATE UNIQUE INDEX "Quotation_bookingId_key" ON "Quotation"("bookingId");

-- CreateIndex
CREATE INDEX "Quotation_customerId_idx" ON "Quotation"("customerId");

-- CreateIndex
CREATE INDEX "Quotation_branchId_idx" ON "Quotation"("branchId");

-- CreateIndex
CREATE INDEX "Quotation_status_idx" ON "Quotation"("status");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_invoiceNumber_key" ON "Invoice"("invoiceNumber");

-- CreateIndex
CREATE INDEX "Invoice_customerId_idx" ON "Invoice"("customerId");

-- CreateIndex
CREATE INDEX "Invoice_bookingId_idx" ON "Invoice"("bookingId");

-- CreateIndex
CREATE INDEX "Invoice_status_idx" ON "Invoice"("status");

-- CreateIndex
CREATE UNIQUE INDEX "EntityRole_name_key" ON "EntityRole"("name");

-- CreateIndex
CREATE INDEX "UserEntityRole_userId_idx" ON "UserEntityRole"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserEntityRole_userId_entityRoleId_key" ON "UserEntityRole"("userId", "entityRoleId");

-- CreateIndex
CREATE INDEX "AuthorizedSignatory_vendorProfileId_idx" ON "AuthorizedSignatory"("vendorProfileId");

-- CreateIndex
CREATE INDEX "CompanyContact_vendorProfileId_idx" ON "CompanyContact"("vendorProfileId");

-- CreateIndex
CREATE INDEX "DepartmentContact_vendorProfileId_idx" ON "DepartmentContact"("vendorProfileId");

-- CreateIndex
CREATE INDEX "BankingInfo_vendorProfileId_idx" ON "BankingInfo"("vendorProfileId");

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quotation" ADD CONSTRAINT "Quotation_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_bookingId_fkey" FOREIGN KEY ("bookingId") REFERENCES "Booking"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AdminAuditLog" ADD CONSTRAINT "AdminAuditLog_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntityRole" ADD CONSTRAINT "UserEntityRole_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserEntityRole" ADD CONSTRAINT "UserEntityRole_entityRoleId_fkey" FOREIGN KEY ("entityRoleId") REFERENCES "EntityRole"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AuthorizedSignatory" ADD CONSTRAINT "AuthorizedSignatory_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CompanyContact" ADD CONSTRAINT "CompanyContact_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DepartmentContact" ADD CONSTRAINT "DepartmentContact_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BankingInfo" ADD CONSTRAINT "BankingInfo_vendorProfileId_fkey" FOREIGN KEY ("vendorProfileId") REFERENCES "VendorProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
