import { prisma } from "../lib/prisma.js";

interface IStudentPlan {
  studentId: string;
  planId: string;
  startDate: Date;
  endDate?: Date;
  priceAtPurchase: number;
}

async function createStudentPlanService(
  studentPlanInfo: IStudentPlan,
  userId: string,
) {
  const { studentId, planId, startDate, endDate, priceAtPurchase } =
    studentPlanInfo;

  if (endDate && startDate > endDate) {
    throw new Error("Invalid time interval");
  }

  // Make sure the student belongs the specified user
  await prisma.student.findFirstOrThrow({
    where: {
      id: studentId,
      userId,
    },
  });

  // Make sure the plan belongs the specified user
  const userPlan = await prisma.userPlan.findFirstOrThrow({
    where: {
      id: planId,
      userId,
    },
    select: {
      durationInWeeks: true,
    },
  });

  //Calculate the End Date Based on userPlan duration in Weeks
  const currentDate = new Date();
  const durationInDays = userPlan.durationInWeeks * 7;
  const studentPlanEndDate = new Date(currentDate);
  studentPlanEndDate.setDate(studentPlanEndDate.getDate() + durationInDays);

  return prisma.$transaction(async (tx) => {
    const activePlan = await tx.studentPlan.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
      },
      select: { id: true },
    });

    if (activePlan) {
      throw new Error("Student already has an active plan");
    }
    //Creates a new Contract
    return await tx.studentPlan.create({
      data: {
        studentId,
        planId,
        startDate: currentDate,
        endDate: studentPlanEndDate,
        priceAtPurchase,
        status: "ACTIVE",
      },
    });
  });
}

async function cancelStudentPlanService(studentPlanId: string, userId: string) {
  // Make sure the plan exists, is active and belong to the user
  const studentPlan = await prisma.studentPlan.findFirstOrThrow({
    where: {
      id: studentPlanId,
      status: "ACTIVE",
      student: {
        userId: userId,
      },
    },
  });

  return prisma.studentPlan.update({
    where: { id: studentPlan.id },
    data: {
      status: "INACTIVE",
      endDate: new Date(),
    },
  });
}

export { createStudentPlanService, cancelStudentPlanService };
