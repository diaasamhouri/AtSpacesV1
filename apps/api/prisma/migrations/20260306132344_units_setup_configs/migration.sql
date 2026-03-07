/*
  Warnings:

  - You are about to drop the column `setupType` on the `Service` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Service" DROP COLUMN "setupType",
ADD COLUMN     "unitNumber" TEXT,
ALTER COLUMN "capacity" DROP NOT NULL;

-- CreateTable
CREATE TABLE "ServiceSetupConfig" (
    "id" TEXT NOT NULL,
    "serviceId" TEXT NOT NULL,
    "setupType" "SetupType" NOT NULL,
    "minPeople" INTEGER NOT NULL DEFAULT 1,
    "maxPeople" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ServiceSetupConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ServiceSetupConfig_serviceId_idx" ON "ServiceSetupConfig"("serviceId");

-- CreateIndex
CREATE UNIQUE INDEX "ServiceSetupConfig_serviceId_setupType_key" ON "ServiceSetupConfig"("serviceId", "setupType");

-- AddForeignKey
ALTER TABLE "ServiceSetupConfig" ADD CONSTRAINT "ServiceSetupConfig_serviceId_fkey" FOREIGN KEY ("serviceId") REFERENCES "Service"("id") ON DELETE CASCADE ON UPDATE CASCADE;
