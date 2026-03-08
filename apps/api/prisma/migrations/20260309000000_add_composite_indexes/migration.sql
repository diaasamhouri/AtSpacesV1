-- CreateIndex
CREATE INDEX "Booking_branchId_status_startTime_idx" ON "Booking"("branchId", "status", "startTime");

-- CreateIndex
CREATE INDEX "Booking_status_createdAt_idx" ON "Booking"("status", "createdAt");

-- CreateIndex
CREATE INDEX "Branch_vendorProfileId_status_idx" ON "Branch"("vendorProfileId", "status");

-- CreateIndex
CREATE INDEX "Notification_userId_isRead_createdAt_idx" ON "Notification"("userId", "isRead", "createdAt");

-- CreateIndex
CREATE INDEX "Payment_status_createdAt_idx" ON "Payment"("status", "createdAt");
