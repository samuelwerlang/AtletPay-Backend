/*
  Warnings:

  - You are about to drop the column `saasPlanType` on the `SaasPlan` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[type]` on the table `SaasPlan` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `type` to the `SaasPlan` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "SaasPlan_saasPlanType_key";

-- AlterTable
ALTER TABLE "SaasPlan" DROP COLUMN "saasPlanType",
ADD COLUMN     "type" "SaasPlanType" NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "SaasPlan_type_key" ON "SaasPlan"("type");
