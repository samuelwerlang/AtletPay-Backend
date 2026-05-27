import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import pkg from "@prisma/client";
const { SubscriptionStatus } = pkg;
import type { SubscriptionStatus as SubscriptionStatusType } from "@prisma/client";
export interface SubscriptionDTO {
  userId: string;
  saasPlanId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: SubscriptionStatusType;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
}

function extractStripeCustomerId(
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customerId === "string" ? customerId : customerId.id;
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
        stripeCustomerId: extractStripeCustomerId(
          subscriptionData.stripeCustomerId,
        ),
        // status: SubscriptionStatus.ACTIVE,
      },
    });
  });
  return createdSubscription;
}

async function updateSubscriptionService(
  subscriptionData: SubscriptionDTO,
  userId: string,
) {
  return prisma.subscription.upsert({
    where: {
      stripeSubscriptionId: subscriptionData.stripeSubscriptionId,
      userId,
    },
    update: { ...subscriptionData },
    create: {
      ...subscriptionData,
      stripeCustomerId: extractStripeCustomerId(
        subscriptionData.stripeCustomerId,
      ),
      // status vem do subscriptionData.status
    },
  });
}

export { createSubscriptionService, updateSubscriptionService };
