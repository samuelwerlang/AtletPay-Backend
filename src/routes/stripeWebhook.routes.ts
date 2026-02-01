// --Setup--
import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

// --Services--
import { createSubscriptionService } from "../services/subscriptions.services.js";

// --Utils--
import { mapStripeStatusToPrisma } from "../utils/statusMap.js";
import { getSubscriptionPeriod } from "../utils/getSubscriptionPeriod.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/stripe/webhook",
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

          const userId = session.client_reference_id!;
          const stripeCustomerId =
            typeof session.customer === "string"
              ? session.customer
              : session.customer?.id;

          // Atualiza o User com Customer
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
        case "customer.subscription.created": {
          const sub = event.data.object as Stripe.Subscription;

          const stripeCustomerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id;

          if (!stripeCustomerId) {
            console.warn("Missing stripe customerId");
            break;
          }

          const user = await prisma.user.findFirst({
            where: {
              stripeCustomerId,
            },
            select: {
              id: true,
            },
          });

          if (!user) {
            console.warn(
              "User associated with the given stripeCustomerId not found",
            );
            break;
          }

          const priceId = sub.items?.data?.[0]?.price?.id;
          if (!priceId) {
            console.warn("Missing PriceId in subscription");
            break;
          }

          const saasPlan = await prisma.saasPlan.findUnique({
            where: { StripePriceId: priceId },
            select: { id: true },
          });

          if (!saasPlan) {
            console.warn("SaasPlan não encontrado para Price:", priceId);
            break;
          }

          const { currentPeriodStart, currentPeriodEnd } =
            await getSubscriptionPeriod(sub);

          await createSubscriptionService({
            userId: user!.id,
            saasPlanId: saasPlan.id,
            stripeCustomerId:
              typeof sub.customer === "string" ? sub.customer : sub.customer.id,
            stripeSubscriptionId: sub.id,
            status: mapStripeStatusToPrisma(sub.status),
            cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
            currentPeriodStart,
            currentPeriodEnd,
          });
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
