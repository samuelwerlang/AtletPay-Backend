import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";

import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../services/subscriptions.services.js";

function mapStripeStatusToPrisma(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

const getUserBasedOnCustomerId = async (stripeCustomerId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      stripeCustomerId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    console.warn("User associated with the given stripeCustomerId not found");
    return null;
  }
  return user;
};

const getSaasPlanBasedOnPriceId = async (priceId: string) => {
  const saasPlan = await prisma.saasPlan.findUnique({
    where: { StripePriceId: priceId },
    select: { id: true },
  });
  if (!saasPlan) {
    console.warn("SaasPlan não encontrado para Price:", priceId);
    return null;
  }

  return saasPlan;
};

async function getSubscriptionPeriod(sub: any) {
  const startSec =
    sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start;
  const endSec =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    currentPeriodStart: startSec ? new Date(startSec * 1000) : new Date(),
    currentPeriodEnd: endSec ? new Date(endSec * 1000) : new Date(),
  };
}

// --- Global Handler for Subscriptions ---
async function handleSubscriptionEvent(
  sub: Stripe.Subscription,
  service: "create" | "update",
) {
  const stripeCustomerId =
    typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
  const priceId = sub.items?.data?.[0]?.price?.id;
  const user = await getUserBasedOnCustomerId(stripeCustomerId);
  const saasPlan = await getSaasPlanBasedOnPriceId(priceId);
  const { currentPeriodStart, currentPeriodEnd } =
    await getSubscriptionPeriod(sub);

  if (!user || !priceId || !saasPlan || !stripeCustomerId) return;

  const subscriptionData = {
    userId: user.id,
    saasPlanId: saasPlan.id,
    stripeCustomerId,
    stripeSubscriptionId: sub.id,
    status: mapStripeStatusToPrisma(sub.status),
    cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
    currentPeriodStart,
    currentPeriodEnd,
  };

  if (service === "create") {
    await createSubscriptionService(subscriptionData);
  } else {
    await updateSubscriptionService(subscriptionData, user.id);
  }

  console.log(
    `Subscription ${service}d for user ${user.id} | stripeSubscriptionId: ${sub.id}`,
  );
}

export {
  mapStripeStatusToPrisma,
  getUserBasedOnCustomerId,
  getSaasPlanBasedOnPriceId,
  getSubscriptionPeriod,
  handleSubscriptionEvent,
};
