/*
  Warnings:

  - You are about to drop the column `active` on the `RecurringCharge` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[studentPlanId,dueDate]` on the table `Charge` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `studentPlanId` to the `Charge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `nextRunAt` to the `RecurringCharge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `studentPlanId` to the `RecurringCharge` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `RecurringCharge` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "RecurringStatus" AS ENUM ('ACTIVE', 'PAUSED', 'CANCELED');

-- DropForeignKey
ALTER TABLE "Charge" DROP CONSTRAINT "Charge_studentId_fkey";

-- DropForeignKey
ALTER TABLE "RecurringCharge" DROP CONSTRAINT "RecurringCharge_studentId_fkey";

-- AlterTable
ALTER TABLE "Charge" ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "externalId" TEXT,
ADD COLUMN     "paidAt" TIMESTAMP(3),
ADD COLUMN     "studentPlanId" TEXT NOT NULL,
ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- AlterTable
ALTER TABLE "RecurringCharge" DROP COLUMN "active",
ADD COLUMN     "anchorDayOfMonth" INTEGER,
ADD COLUMN     "currency" TEXT NOT NULL DEFAULT 'BRL',
ADD COLUMN     "lastRunAt" TIMESTAMP(3),
ADD COLUMN     "nextRunAt" TIMESTAMP(3) NOT NULL,
ADD COLUMN     "status" "RecurringStatus" NOT NULL DEFAULT 'ACTIVE',
ADD COLUMN     "studentPlanId" TEXT NOT NULL,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL,
ALTER COLUMN "interval" SET DEFAULT 'MONTHLY';

-- CreateIndex
CREATE INDEX "Charge_studentPlanId_idx" ON "Charge"("studentPlanId");

-- CreateIndex
CREATE UNIQUE INDEX "Charge_studentPlanId_dueDate_key" ON "Charge"("studentPlanId", "dueDate");

-- CreateIndex
CREATE INDEX "RecurringCharge_studentPlanId_idx" ON "RecurringCharge"("studentPlanId");

-- CreateIndex
CREATE INDEX "RecurringCharge_studentId_idx" ON "RecurringCharge"("studentId");

-- AddForeignKey
ALTER TABLE "Charge" ADD CONSTRAINT "Charge_studentPlanId_fkey" FOREIGN KEY ("studentPlanId") REFERENCES "StudentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RecurringCharge" ADD CONSTRAINT "RecurringCharge_studentPlanId_fkey" FOREIGN KEY ("studentPlanId") REFERENCES "StudentPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
