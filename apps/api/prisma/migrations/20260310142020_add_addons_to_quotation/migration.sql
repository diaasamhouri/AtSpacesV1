-- CreateTable
CREATE TABLE "QuotationAddOn" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "vendorAddOnId" TEXT,
    "name" TEXT NOT NULL,
    "unitPrice" DECIMAL(10,3) NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,
    "totalPrice" DECIMAL(10,3) NOT NULL,
    "serviceTime" TEXT,
    "comments" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuotationAddOn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuotationAddOn_quotationId_idx" ON "QuotationAddOn"("quotationId");

-- AddForeignKey
ALTER TABLE "QuotationAddOn" ADD CONSTRAINT "QuotationAddOn_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "Quotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuotationAddOn" ADD CONSTRAINT "QuotationAddOn_vendorAddOnId_fkey" FOREIGN KEY ("vendorAddOnId") REFERENCES "VendorAddOn"("id") ON DELETE SET NULL ON UPDATE CASCADE;
