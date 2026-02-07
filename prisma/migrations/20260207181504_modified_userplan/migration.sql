/*
  Warnings:

  - A unique constraint covering the columns `[userId,name]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId,stripeProductId]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeAccountId,stripePriceId]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.
  - Made the column `stripeAccountId` on table `UserPlan` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "UserPlan_stripeAccountId_key";

-- DropIndex
DROP INDEX "UserPlan_stripePriceId_key";

-- DropIndex
DROP INDEX "UserPlan_stripeProductId_key";

-- AlterTable
ALTER TABLE "UserPlan" ALTER COLUMN "stripeAccountId" SET NOT NULL;

-- CreateIndex
CREATE INDEX "UserPlan_stripeAccountId_idx" ON "UserPlan"("stripeAccountId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_userId_name_key" ON "UserPlan"("userId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeAccountId_stripeProductId_key" ON "UserPlan"("stripeAccountId", "stripeProductId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeAccountId_stripePriceId_key" ON "UserPlan"("stripeAccountId", "stripePriceId");
