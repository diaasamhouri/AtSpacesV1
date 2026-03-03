/*
  Warnings:

  - You are about to drop the column `amenities` on the `VendorProfile` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Branch" ADD COLUMN     "amenities" TEXT[];

-- AlterTable
ALTER TABLE "VendorProfile" DROP COLUMN "amenities";
