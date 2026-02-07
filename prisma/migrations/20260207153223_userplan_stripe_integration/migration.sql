/*
  Warnings:

  - A unique constraint covering the columns `[stripePriceId]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[stripeProductId]` on the table `UserPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripePriceId` to the `UserPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `stripeProductId` to the `UserPlan` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Charge" ALTER COLUMN "status" SET DEFAULT 'PAID';

-- AlterTable
ALTER TABLE "UserPlan" ADD COLUMN     "stripePriceId" TEXT NOT NULL,
ADD COLUMN     "stripeProductId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripePriceId_key" ON "UserPlan"("stripePriceId");

-- CreateIndex
CREATE UNIQUE INDEX "UserPlan_stripeProductId_key" ON "UserPlan"("stripeProductId");
