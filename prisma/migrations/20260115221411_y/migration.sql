/*
  Warnings:

  - Changed the type of `saasPlanType` on the `SaasPlan` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- CreateEnum
CREATE TYPE "SaasPlanType" AS ENUM ('FREE', 'BASIC', 'PRO', 'PREMIUM');

-- AlterTable
ALTER TABLE "SaasPlan" DROP COLUMN "saasPlanType",
ADD COLUMN     "saasPlanType" "SaasPlanType" NOT NULL;

-- DropEnum
DROP TYPE "SAAS_PLAN_TYPE";

-- CreateIndex
CREATE UNIQUE INDEX "SaasPlan_saasPlanType_key" ON "SaasPlan"("saasPlanType");
