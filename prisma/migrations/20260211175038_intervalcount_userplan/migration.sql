-- CreateEnum
CREATE TYPE "UserPlanRecurringIntervalCount" AS ENUM ('MONTHLY', 'BIMONTHLY', 'TRIMONTHLY', 'SEMIANNUALLY', 'ANUALLY');

-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "intervalCount" "UserPlanRecurringIntervalCount";
