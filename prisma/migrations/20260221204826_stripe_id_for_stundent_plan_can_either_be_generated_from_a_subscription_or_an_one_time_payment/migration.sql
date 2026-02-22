/*
  Warnings:

  - You are about to drop the column `planId` on the `StudentPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[stripeId]` on the table `StudentPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `stripeId` to the `StudentPlan` table without a default value. This is not possible if the table is not empty.
  - Added the required column `userPlanId` to the `StudentPlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "StudentPlan" DROP CONSTRAINT "StudentPlan_planId_fkey";

-- DropIndex
DROP INDEX "StudentPlan_planId_idx";

-- AlterTable
ALTER TABLE "StudentPlan" DROP COLUMN "planId",
ADD COLUMN     "stripeId" TEXT NOT NULL,
ADD COLUMN     "userPlanId" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "StudentPlan_stripeId_key" ON "StudentPlan"("stripeId");

-- CreateIndex
CREATE INDEX "StudentPlan_userPlanId_idx" ON "StudentPlan"("userPlanId");

-- AddForeignKey
ALTER TABLE "StudentPlan" ADD CONSTRAINT "StudentPlan_userPlanId_fkey" FOREIGN KEY ("userPlanId") REFERENCES "UserPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
