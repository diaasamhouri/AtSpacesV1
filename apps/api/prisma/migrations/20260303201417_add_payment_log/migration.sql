-- CreateTable
CREATE TABLE "PaymentLog" (
    "id" TEXT NOT NULL,
    "paymentId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "performedById" TEXT NOT NULL,
    "receiptNumber" TEXT,
    "notes" TEXT,
    "details" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PaymentLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PaymentLog_paymentId_idx" ON "PaymentLog"("paymentId");

-- CreateIndex
CREATE INDEX "PaymentLog_performedById_idx" ON "PaymentLog"("performedById");

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PaymentLog" ADD CONSTRAINT "PaymentLog_performedById_fkey" FOREIGN KEY ("performedById") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
