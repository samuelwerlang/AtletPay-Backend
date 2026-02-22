/*
  Warnings:

  - The values [INACTIVE] on the enum `StudentPlanStatus` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "StudentPlanStatus_new" AS ENUM ('ACTIVE', 'CANCELED', 'PAST_DUE', 'INCOMPLETE', 'UNPAID', 'TRIALING');
ALTER TABLE "public"."StudentPlan" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "StudentPlan" ALTER COLUMN "status" TYPE "StudentPlanStatus_new" USING ("status"::text::"StudentPlanStatus_new");
ALTER TYPE "StudentPlanStatus" RENAME TO "StudentPlanStatus_old";
ALTER TYPE "StudentPlanStatus_new" RENAME TO "StudentPlanStatus";
DROP TYPE "public"."StudentPlanStatus_old";
ALTER TABLE "StudentPlan" ALTER COLUMN "status" SET DEFAULT 'ACTIVE';
COMMIT;
