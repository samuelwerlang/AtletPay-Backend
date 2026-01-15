/*
  Warnings:

  - A unique constraint covering the columns `[personalId]` on the table `Student` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Student_personalId_key" ON "Student"("personalId");
