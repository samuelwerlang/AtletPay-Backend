import { prisma } from "../lib/prisma.js";

interface IPlanInfo {
  name: string;
  price: number;
  description: string;
  durationInWeeks: number;
  sessionsPerWeek: number;
  userId: string;
}

async function createUserPlanService(planInfo: IPlanInfo) {
  const { name, price, description, durationInWeeks, sessionsPerWeek, userId } =
    planInfo;
  return prisma.userPlan.create({
    data: {
      name,
      price,
      description,
      durationInWeeks,
      sessionsPerWeek,
      userId,
    },
  });
}

async function updateUserPlanService(
  planInfo: IPlanInfo,
  userId: string,
  planId: string,
) {
  const { name, price, description, durationInWeeks, sessionsPerWeek } =
    planInfo;

  const updatedUserPlan = await prisma.userPlan.updateMany({
    where: {
      id: planId,
      userId: userId,
    },
    data: {
      name,
      price,
      description,
      durationInWeeks,
      sessionsPerWeek,
    },
  });
  if (updatedUserPlan.count === 0) {
    throw new Error("Plan not found or not owned by user");
  }

  return updatedUserPlan;
}

async function getUserPlanService(planId: string, userId: string) {
  return prisma.userPlan.findFirstOrThrow({
    where: {
      id: planId,
      userId: userId,
    },
  });
}

async function deleteUserPlanService(planId: string, userId: string) {
  const result = await prisma.userPlan.deleteMany({
    where: {
      id: planId,
      userId,
    },
  });

  if (result.count === 0) {
    throw new Error("Plan not found or not owned by user");
  }

  return result;
}

export {
  createUserPlanService,
  getUserPlanService,
  updateUserPlanService,
  deleteUserPlanService,
};
