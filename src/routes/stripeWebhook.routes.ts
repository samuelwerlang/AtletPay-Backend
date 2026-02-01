import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { prisma } from "../lib/prisma.js";
// Troque o import:
import { createSubscriptionService } from "../services/subscriptions.services.js";
import mapStripeStatusToPrisma from "../utils/statusMap.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

// helper que funciona em API antiga e nova
function getSubscriptionPeriod(sub: any) {
  const startSec =
    sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start;
  const endSec =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    currentPeriodStart: startSec ? new Date(startSec * 1000) : new Date(),
    currentPeriodEnd: endSec ? new Date(endSec * 1000) : new Date(),
  };
}

router.post(
  "/stripe/webhook",
  express.raw({ type: "application/json" }),
  async (request, response) => {
    console.log("HIT /api/stripe/webhook", {
      url: (request as any).originalUrl,
      method: request.method,
    });
    const endpointSecret = `${config.STRIPE_WEBHOOK_SECRET}`;

    let event: Stripe.Event;
    try {
      const signature = request.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        request.body,
        signature,
        endpointSecret,
      );
      console.log("EVENT:", event.type, event.id);

      if (event.type === "checkout.session.completed") {
        const s = event.data.object as Stripe.Checkout.Session;
        console.log("SESSION:", {
          client_reference_id: s.client_reference_id,
          customer: s.customer,
          subscription: s.subscription,
        });
      }
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
              console.log(
                "User atualizado com stripeCustomerId:",
                userId,
                stripeCustomerId,
              );
            } catch (e) {
              console.error("Erro ao atualizar stripeCustomerId:", e);
            }
          } else {
            console.warn(
              "userId ou stripeCustomerId ausentes no checkout.session.completed",
            );
          }

          // Cria/atualiza Subscription local
          if (session.mode === "subscription" && session.subscription) {
            try {
              const sub = await stripe.subscriptions.retrieve(
                session.subscription as string,
              );

              const priceId = sub.items?.data?.[0]?.price?.id;
              if (!priceId) {
                console.warn("PriceId ausente na Subscription");
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
                getSubscriptionPeriod(sub);

              await createSubscriptionService({
                userId,
                saasPlanId: saasPlan.id,
                stripeCustomerId:
                  typeof sub.customer === "string"
                    ? sub.customer
                    : sub.customer.id,
                stripeSubscriptionId: sub.id,
                status: mapStripeStatusToPrisma(sub.status),
                cancelAtPeriodEnd: sub.cancel_at_period_end ?? false,
                currentPeriodStart,
                currentPeriodEnd,
              });
              console.log("Subscription criada/atualizada:", sub.id);
            } catch (e) {
              console.error("Erro ao criar/atualizar Subscription:", e);
            }
          }
          break;
        }
        default:
          console.log("Unhandled event type:", event.type);
          break;
      }
    } catch (err) {
      console.error("Webhook handler error:", err);
    }

    return response.json({ received: true });
  },
);

export default router;
