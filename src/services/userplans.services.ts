import { prisma } from "../lib/prisma.js";

interface IPlanInfo {
  name: string;
  price: number;
  description: string;
  durationInWeeks: number;
  sessionsPerWeek: number;
}

async function createUserPlanService(planInfo: IPlanInfo, userId: string) {
  const { name, price, description, durationInWeeks, sessionsPerWeek } =
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
  planInfo: Partial<IPlanInfo>,
  userId: string,
  planId: string,
) {
  const updatedUserPlan = await prisma.userPlan.updateMany({
    where: {
      id: planId,
      userId: userId,
    },
    data: planInfo,
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

async function getAllUserPlansService(userId: string) {
  return prisma.userPlan.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

export {
  createUserPlanService,
  getUserPlanService,
  updateUserPlanService,
  deleteUserPlanService,
  getAllUserPlansService,
};
