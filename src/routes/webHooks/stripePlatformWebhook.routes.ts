// --Setup--
import config from "../../config/config.js";
import express from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";

// --Utils--
import { handleSubscriptionEvent } from "../../utils/stripeWebhookHandlers.js";
import { SubscriptionStatus } from "@prisma/client";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/webhook/stripe/platform",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    const endpointSecret = `${config.STRIPE_WEBHOOK_SECRET}`;

    let event: Stripe.Event;
    try {
      const signature = request.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret,
      );
    } catch (err: any) {
      console.error("⚠️ Webhook signature verification failed:", err.message);
      return response.sendStatus(400);
    }

    try {
      switch (event.type) {
        case "checkout.session.completed": {
          const session = event.data.object as Stripe.Checkout.Session;
          console.log(session.customer);

          const userId = session.client_reference_id!;
          const stripeCustomerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;

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

          break;
        }
        case "customer.subscription.created":
          await handleSubscriptionEvent(
            event.data.object as Stripe.Subscription,
            "create",
          );
          break;

        // --- Works for both cases ---
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionEvent(
            event.data.object as Stripe.Subscription,
            "update",
          );
          break;
        default:
          console.error("Unhandled event type:", event.type);
          break;
      }
    } catch (err) {
      console.error("Webhook handler error:", err);
    }
    return response.send();
  },
);

export default router;
