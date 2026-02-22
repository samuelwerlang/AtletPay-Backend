// --Setup--
import config from "../../config/config.js";
import express from "express";
import Stripe from "stripe";
import { prisma } from "../../lib/prisma.js";

// --Utils--
import {
  handleCheckoutCompletedEvent,
  handleSubscriptionEvent,
  handleInvoiceEvent,
} from "../../utils/stripePlatformWebhookHandlers.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/stripe/platform",
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
          const stripeCheckoutSession = event.data
            .object as Stripe.Checkout.Session;
          await handleCheckoutCompletedEvent(stripeCheckoutSession);
          break;
        }
        case "customer.subscription.created":
          await handleSubscriptionEvent(
            event.data.object as Stripe.Subscription,
            "create",
          );
          break;

        // --- Function handleSubscriptionEvent works for both cases ---
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionEvent(
            event.data.object as Stripe.Subscription,
            "update",
          );
          break;

        // --- Function handleInvoiceEvent works for each case aswell ---
        case "invoice.paid":
        case "invoice.payment_succeeded":
        case "invoice.payment_failed": {
          const stripeInvoice: Stripe.Invoice | any = event.data.object;
          await handleInvoiceEvent(stripeInvoice);
          break;
        }
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
