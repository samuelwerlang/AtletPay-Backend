// --Setup--
import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";

// --Services--
import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../services/subscriptions.services.js";

// --Utils--
import { mapStripeStatusToPrisma } from "../utils/statusMap.js";
//import { getSubscriptionPeriod } from "../utils/getSubscriptionPeriod.js";
import {
  getUserBasedOnCustomerId,
  getSaasPlanBasedOnPriceId,
  getSubscriptionPeriod,
} from "../utils/stripeWebhookHandlers.js";
import { SubscriptionStatus } from "@prisma/client";

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
          console.log(session.customer);

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
          const priceId = sub.items?.data?.[0]?.price?.id;
          const user = await getUserBasedOnCustomerId(stripeCustomerId);
          const saasPlan = await getSaasPlanBasedOnPriceId(priceId);
          const { currentPeriodStart, currentPeriodEnd } =
            await getSubscriptionPeriod(sub);
          if (!stripeCustomerId) {
            console.warn("Missing stripe customerId");
            break;
          }
          if (!priceId) {
            console.warn("Missing PriceId in subscription");
            break;
          }
          if (!user) {
            break;
          }
          if (!saasPlan) {
            break;
          }
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
        case "customer.subscription.updated": {
          const sub = event.data.object as Stripe.Subscription;
          const stripeCustomerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const priceId = sub.items?.data?.[0]?.price?.id;
          const user = await getUserBasedOnCustomerId(stripeCustomerId);
          const saasPlan = await getSaasPlanBasedOnPriceId(priceId);
          const { currentPeriodStart, currentPeriodEnd } =
            await getSubscriptionPeriod(sub);

          if (!user) break;
          if (!priceId || !saasPlan) break;

          await updateSubscriptionService(
            {
              userId: user.id,
              saasPlanId: saasPlan.id,
              stripeCustomerId,
              stripeSubscriptionId: sub.id,
              status: mapStripeStatusToPrisma(sub.status),
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
              currentPeriodStart,
              currentPeriodEnd,
            },
            user.id,
          );
          console.log(
            `Subscription updated for user ${user.id} | stripeSubscriptionId: ${sub.id}`,
          );
          break;
        }
        case "customer.subscription.deleted": {
          const sub = event.data.object as Stripe.Subscription;
          const stripeCustomerId =
            typeof sub.customer === "string" ? sub.customer : sub.customer?.id;
          const priceId = sub.items?.data?.[0]?.price?.id;
          const user = await getUserBasedOnCustomerId(stripeCustomerId);
          const saasPlan = await getSaasPlanBasedOnPriceId(priceId);
          const { currentPeriodStart, currentPeriodEnd } =
            await getSubscriptionPeriod(sub);

          if (!user) break;
          if (!priceId || !saasPlan) break;

          await updateSubscriptionService(
            {
              userId: user.id,
              saasPlanId: saasPlan.id,
              stripeCustomerId,
              stripeSubscriptionId: sub.id,
              status: SubscriptionStatus.CANCELED,
              cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
              currentPeriodStart,
              currentPeriodEnd,
            },
            user.id,
          );
          console.log(
            `Subscription canceled for user ${user.id} | stripeSubscriptionId: ${sub.id}`,
          );
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
