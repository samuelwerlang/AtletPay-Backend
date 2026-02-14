import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { StudentPlanStatus } from "@prisma/client";

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
    studentPlanEndDate.getMonth() + userPlan.durationInMonths,
  );
  if (now > studentPlanEndDate) {
    throw new Error("Invalid time interval");
  }

  // Check if student already has an active plan
  // Active Plan == status ACTIVE + endDate > now
  const activePlan = await tx.studentPlan.findFirst({
    where: {
      studentId,
      status: "ACTIVE",
      endDate: {
        gt: new Date(),
      },
    },
    select: { id: true },
  });

  if (activePlan) {
    throw new Error("Student already has an active plan");
  }

  // Create plan as ACTIVE
  return tx.studentPlan.create({
    data: {
      studentId,
      planId,
      startDate: now,
      endDate: studentPlanEndDate,
      priceAtPurchase: userPlan.price,
      status: StudentPlanStatus.ACTIVE,
    },
  });
}

export default createStudentPlanService;

async function cancelStudentPlanService(
  tx: Prisma.TransactionClient,
  studentPlanId: string,
  userId: string,
) {
  // Make sure the plan exists, is active and belong to the user
  const studentPlan = await tx.studentPlan.findFirstOrThrow({
    where: {
      id: studentPlanId,
      status: "ACTIVE",
      endDate: {
        gt: new Date(),
      },
      student: {
        userId: userId,
      },
    },
  });

  return tx.studentPlan.update({
    where: { id: studentPlan.id },
    data: {
      status: "INACTIVE",
      endDate: new Date(),
    },
  });
}

export { createStudentPlanService, cancelStudentPlanService };
