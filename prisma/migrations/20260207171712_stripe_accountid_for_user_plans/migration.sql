/*
  Warnings:

  - A unique constraint covering the columns `[stripeAccountId]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "stripeAccountId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeAccountId_key" ON "UserPlan"("stripeAccountId");
