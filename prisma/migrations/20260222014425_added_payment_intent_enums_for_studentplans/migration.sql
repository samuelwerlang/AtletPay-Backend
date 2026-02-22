-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "StudentPlanStatus" ADD VALUE 'PAUSED';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'PROCESSING';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'INCOMPLETE_EXPIRED';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'REQUIRES_ACTION';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'REQUIRES_CAPTURE';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'REQUIRES_CONFIRMATION';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'REQUIRES_PAYMENT_METHOD';
ALTER TYPE "StudentPlanStatus" ADD VALUE 'SUCCEEDED';
