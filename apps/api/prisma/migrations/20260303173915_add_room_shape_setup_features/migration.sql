-- CreateEnum
CREATE TYPE "RoomShape" AS ENUM ('L_SHAPE', 'U_SHAPE', 'RECTANGLE', 'SQUARE', 'OVAL', 'CUSTOM');

-- CreateEnum
CREATE TYPE "SetupType" AS ENUM ('CLASSROOM', 'THEATER', 'BOARDROOM', 'U_SHAPE_SEATING', 'HOLLOW_SQUARE', 'BANQUET');

-- AlterTable
ALTER TABLE "Service" ADD COLUMN     "features" TEXT[],
ADD COLUMN     "setupType" "SetupType",
ADD COLUMN     "shape" "RoomShape";
