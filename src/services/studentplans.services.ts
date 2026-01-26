import { prisma } from "../lib/prisma.js";

interface IStudentPlan {
  studentId: string;
  planId: string;
  startDate: Date;
  endDate: Date;
  priceAtPurchase : number;
}

async function createStudentPlanService(studentPlanInfo : IStudentPlan) {

  const {studentId, planId, startDate, endDate, priceAtPurchase} = studentPlanInfo;

  if (startDate > endDate) {
    throw new Error("Invalid time interval")
  }
  return await prisma.studentPlan.create({
    data : {
      studentId,
      planId,
      startDate,
      endDate,
      priceAtPurchase
    }});
}


export {createStudentPlanService} 