/*
  Warnings:

  - You are about to drop the column `durationInWeeks` on the `UserPlan` table. All the data in the column will be lost.
  - The `intervalCount` column on the `UserPlan` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `durationInMonths` to the `UserPlan` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "UserPlanRecurringIntervalType" AS ENUM ('MONTHLY', 'BIMONTHLY', 'TRIMONTHLY', 'SEMIANNUALLY', 'ANUALLY');

-- AlterTable
ALTER TABLE "UserPlan" DROP COLUMN "durationInWeeks",
ADD COLUMN     "durationInMonths" INTEGER NOT NULL,
DROP COLUMN "intervalCount",
ADD COLUMN     "intervalCount" "UserPlanRecurringIntervalType";

-- DropEnum
DROP TYPE "UserPlanRecurringIntervalCount";
