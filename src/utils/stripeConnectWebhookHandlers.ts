import config from "../config/config.js";
import Stripe from "stripe";

const stripe = new Stripe(config.STRIPE_API_KEY);

async function handleConnectSubscription(
  stripeSubscription: Stripe.Subscription,
  service: "create" | "update",
) {
  const { studentId, userPlanId, userId } = stripeSubscription.metadata || {};
  if (!studentId || !userPlanId || !userId) {
    console.log("[CONNECT-Webhook] Missing subscription metadata");
  }
}
