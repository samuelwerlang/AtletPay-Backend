import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { StudentPlanStatus } from "@prisma/client";
import { recomputeStudentActiveFlag } from "./students.services.js";

export interface IStudentPlan {
  studentId: string;
  planId: string;
  // startDate: Date;
  // endDate?: Date;
  // priceAtPurchase: number;
}

async function createStudentPlanService(
  tx: Prisma.TransactionClient,
  studentPlanInfo: IStudentPlan,
  userId: string,
) {
  const { studentId, planId } = studentPlanInfo;

  // Make sure the student belongs to the specified user
  await tx.student.findFirstOrThrow({
    where: {
      id: studentId,
      userId,
    },
    select: {
      id: true,
    },
  });

  // Make sure the plan belongs to the specified user
  const userPlan = await tx.userPlan.findFirstOrThrow({
    where: {
      id: planId,
      userId,
    },
    select: {
      durationInMonths: true,
      price: true,
    },
  });

  // Calculate end date
  const now = new Date();
  const studentPlanEndDate = new Date(now);
  studentPlanEndDate.setMonth(
    studentPlanEndDate.getMonth() + userPlan.durationInMonths!,
  );
  if (now > studentPlanEndDate) {
    throw new Error("Invalid time interval");
  }

  // Make sure to update Old StudentPlans
  await tx.studentPlan.updateMany({
    where: {
      studentId,
      status: StudentPlanStatus.ACTIVE, // depois: "CURRENT"
      endDate: { lte: now },
    },
    data: { status: StudentPlanStatus.INACTIVE },
  });

  // Check if student already has an active plan
  // Active Plan == status ACTIVE + endDate > now
  const activePlan = await tx.studentPlan.findFirst({
    where: {
      studentId,
      status: StudentPlanStatus.ACTIVE,
      endDate: {
        gt: now,
      },
    },
    select: { id: true },
  });

  if (activePlan) {
    throw new Error("Student already has an active plan");
  }

  // Create plan as ACTIVE
  const createdStudentPlan = await tx.studentPlan.create({
    data: {
      studentId,
      planId,
      startDate: now,
      endDate: studentPlanEndDate,
      priceAtPurchase: userPlan.price,
      status: StudentPlanStatus.ACTIVE,
    },
  });
  //Update Student isActive Flag
  await recomputeStudentActiveFlag(tx, studentId);
  return createdStudentPlan;
}

async function cancelStudentPlanService(
  tx: Prisma.TransactionClient,
  studentPlanId: string,
  userId: string,
) {
  // Make sure the plan exists, is active and belong to the user
  const studentPlan = await tx.studentPlan.findFirstOrThrow({
    where: {
      id: studentPlanId,
      status: StudentPlanStatus.ACTIVE,
      endDate: {
        gt: new Date(),
      },
      student: {
        userId: userId,
      },
    },
  });

  const updatedStudentPlan = await tx.studentPlan.update({
    where: { id: studentPlan.id },
    data: {
      status: StudentPlanStatus.INACTIVE,
      endDate: new Date(),
    },
  });
  // Recompute the student flag
  await recomputeStudentActiveFlag(tx, studentPlan.studentId);
  return updatedStudentPlan;
}

export { createStudentPlanService, cancelStudentPlanService };
