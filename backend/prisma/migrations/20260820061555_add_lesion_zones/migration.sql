-- AlterTable
ALTER TABLE "consultations" ADD COLUMN     "lesion_zones" TEXT[] DEFAULT ARRAY[]::TEXT[];
