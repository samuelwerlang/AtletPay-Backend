import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";
export interface SubscriptionDTO {
  userId: string;
  saasPlanId: string;
  stripeCustomerId: string;
  // Stripe.Customer | Stripe.DeletedCustomer;
  stripeSubscriptionId: string;
  status: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
  currentPeriodEnd: Date;
  currentPeriodStart: Date;
}

function extractStripeCustomerId(
  customerId: string | Stripe.Customer | Stripe.DeletedCustomer,
): string {
  return typeof customerId === "string" ? customerId : customerId.id;
}

// async function createSubscriptionService(dto: SubscriptionDTO) {
//   const stripeCustomerId = extractStripeCustomerId(dto.stripeCustomerId);

//   const result = await prisma.subscription.upsert({
//     where: { stripeSubscriptionId: dto.stripeSubscriptionId },
//     create: {
//       userId: dto.userId,
//       saasPlanId: dto.saasPlanId,
//       stripeCustomerId,
//       stripeSubscriptionId: dto.stripeSubscriptionId,
//       status: dto.status, // NÃO sobrescreva com ACTIVE
//       cancelAtPeriodEnd: dto.cancelAtPeriodEnd ?? false,
//       currentPeriodStart: dto.currentPeriodStart,
//       currentPeriodEnd: dto.currentPeriodEnd,
//     },
//     update: {
//       saasPlanId: dto.saasPlanId,
//       stripeCustomerId,
//       status: dto.status,
//       cancelAtPeriodEnd: dto.cancelAtPeriodEnd ?? false,
//       currentPeriodStart: dto.currentPeriodStart,
//       currentPeriodEnd: dto.currentPeriodEnd,
//     },
//   });

//   return result;
// }

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
