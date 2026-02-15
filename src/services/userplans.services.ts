import config from "../config/config.js";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { UserPlanRecurringIntervalType } from "@prisma/client";
import {
  createRecurrentProductService,
  createOneTimeProductService,
} from "./StripeServices/stripeCreateProductwithPrice.services.js";

interface IPlanInfo {
  name: string;
  price: number;
  description: string;
  durationInMonths?: number;
  sessionsPerWeek: number;
  isRecurrent: boolean;
  intervalType?: UserPlanRecurringIntervalType;
}

async function createUserPlanService(
  planInfo: IPlanInfo,
  userId: string,
  stripeAccountId: string,
) {
  const {
    name,
    price,
    description,
    durationInMonths,
    sessionsPerWeek,
    isRecurrent,
    intervalType,
  } = planInfo;

  const existingPlan = await prisma.userPlan.findFirst({
    where: {
      userId,
      name,
    },
  });

  if (existingPlan) {
    throw new Error("Plan with this name already exists");
  }

  let intervalCount;
  if (isRecurrent && intervalType) {
    switch (intervalType) {
      case UserPlanRecurringIntervalType.MONTHLY:
        intervalCount = 1;
        break;
      case UserPlanRecurringIntervalType.BIMONTHLY:
        intervalCount = 2;
        break;
      case UserPlanRecurringIntervalType.TRIMONTHLY:
        intervalCount = 3;
        break;
      case UserPlanRecurringIntervalType.SEMIANNUALLY:
        intervalCount = 6;
        break;
      case UserPlanRecurringIntervalType.ANUALLY:
        intervalCount = 12;
        break;
    }

    const { productId, priceId } = await createRecurrentProductService({
      name,
      description,
      unitAmount: price,
      currency: "brl",
      stripeAccountId,
      intervalCount: intervalCount,
    });
    return prisma.userPlan.create({
      data: {
        name,
        price,
        description,
        durationInMonths: intervalCount!,
        sessionsPerWeek,
        userId,
        isRecurrent,
        intervalType: intervalType,
        stripeProductId: productId,
        stripePriceId: priceId,
        stripeAccountId: stripeAccountId,
      },
    });
  }

  const { productId, priceId } = await createOneTimeProductService({
    name,
    description,
    unitAmount: price,
    currency: "brl",
    stripeAccountId,
    intervalCount: intervalCount,
  });

  return prisma.userPlan.create({
    data: {
      name,
      price,
      description,
      durationInMonths,
      sessionsPerWeek,
      userId,
      isRecurrent,
      intervalType: intervalType,
      stripeProductId: productId,
      stripePriceId: priceId,
      stripeAccountId: stripeAccountId,
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
  return await prisma.userPlan.findFirstOrThrow({
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
  return await prisma.userPlan.findMany({
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
