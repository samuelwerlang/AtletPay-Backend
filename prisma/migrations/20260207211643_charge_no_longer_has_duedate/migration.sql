/*
  Warnings:

  - You are about to drop the column `dueDate` on the `Charge` table. All the data in the column will be lost.
  - You are about to drop the `RecurringCharge` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "RecurringCharge" DROP CONSTRAINT "RecurringCharge_studentPlanId_fkey";

-- DropIndex
DROP INDEX "Charge_studentPlanId_dueDate_key";

-- AlterTable
ALTER TABLE "Charge" DROP COLUMN "dueDate";

-- DropTable
DROP TABLE "RecurringCharge";
