import config from "../config/config.js";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";

import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../services/subscriptions.services.js";

const stripe = new Stripe(config.STRIPE_API_KEY);

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

async function handleCheckoutCompletedEvent(
  stripeCheckoutSession: Stripe.Checkout.Session,
) {
  const userId = stripeCheckoutSession.client_reference_id!;
  const stripeCustomerId =
    typeof stripeCheckoutSession.customer === "string"
      ? stripeCheckoutSession.customer
      : stripeCheckoutSession.customer?.id;

  // Update user with customerId
  if (userId && stripeCustomerId) {
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId },
      });
    } catch (e) {
      console.error("Erro ao atualizar stripeCustomerId:", e);
    }
  } else {
    console.warn(
      "userId ou stripeCustomerId ausentes no checkout.session.completed",
    );
  }
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

async function handleInvoiceEvent(stripeInvoice: Stripe.Invoice) {
  if (!(stripeInvoice.billing_reason === "subscription_cycle")) {
    console.log(
      "[STRIPE-PLATFORM-WEBHOOK] Invoice doesn't belong to a subscription cycle",
    );
    return;
  }

  const stripeSubscriptionId =
    typeof stripeInvoice.parent?.subscription_details?.subscription === "string"
      ? stripeInvoice.parent.subscription_details.subscription
      : (
          stripeInvoice.parent?.subscription_details
            ?.subscription as Stripe.Subscription
        ).id;

  if (!stripeSubscriptionId) {
    console.log(
      `[STRIPE-PLATFORM-WEBHOOK] Invoice has no subscription ${stripeInvoice.id}`,
    );
    return;
  }

  const stripeSubscriptionObject =
    await stripe.subscriptions.retrieve(stripeSubscriptionId);
  await handleSubscriptionEvent(stripeSubscriptionObject, "update");
}

export {
  mapStripeStatusToPrisma,
  getUserBasedOnCustomerId,
  getSaasPlanBasedOnPriceId,
  getSubscriptionPeriod,
  handleCheckoutCompletedEvent,
  handleSubscriptionEvent,
  handleInvoiceEvent,
};
