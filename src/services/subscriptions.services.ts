import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";
export interface SubscriptionDTO {
  userId: string;
  status: SubscriptionStatus;
  saasPlanId: string;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
}

async function createSubscriptionService(subscriptionData: SubscriptionDTO) {
  const createdSubscription = await prisma.$transaction(async (tx) => {
    const existingSubscription = await tx.subscription.findFirst({
      where: {
        userId: subscriptionData.userId,
        status: {
          in: [
            SubscriptionStatus.ACTIVE,
            SubscriptionStatus.PAST_DUE,
            SubscriptionStatus.INCOMPLETE,
          ],
        },
      },
      select: { status: true },
    });

    if (existingSubscription) {
      throw new Error(
        `User already has an active or pending subscription (${existingSubscription.status})`,
      );
    }

    return tx.subscription.create({
      data: {
        ...subscriptionData,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  });
  return createdSubscription;
}

async function cancelSubscriptionService(userId: string) {
  return prisma.$transaction(async (tx) => {
    const activeSubscription = await tx.subscription.findFirst({
      where: {
        userId,
        status: SubscriptionStatus.ACTIVE,
      },
    });

    if (!activeSubscription) {
      throw new Error("There is no active subscription for this user");
    }
    // Apenas retorna dados para o controller chamar o Stripe
    return activeSubscription;
  });
}

export { createSubscriptionService, cancelSubscriptionService };
