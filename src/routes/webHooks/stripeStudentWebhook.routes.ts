import config from "../../config/config.js";
import { prisma } from "../../lib/prisma.js";
import Stripe from "stripe";
import express, { Router, Request, Response } from "express";

// Services
import {
  markChargePaidService,
  markChargeFailedService,
  createChargeService,
} from "../../services/charges.services.js";
import { ChargeStatus, StudentPlanStatus } from "@prisma/client";

import {
  cancelStudentPlanService,
  createStudentPlanService,
} from "../../services/studentplans.services.js";

const stripe = new Stripe(config.STRIPE_API_KEY);
const router: Router = express.Router();

router.post(
  "/webhook/stripe/connect",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    let event: Stripe.Event;

    // 🔐 Verifica assinatura do Stripe
    try {
      const signature = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error("[Webhook] Signature verification failed:", err.message);
      return res.sendStatus(400);
    }

    try {
      switch (event.type) {
        /**
         * ==========================================
         * PAGAMENTOS AVULSOS (one-time)
         * ==========================================
         */
        case "payment_intent.succeeded": {
          const paymentIntent = event.data.object as Stripe.PaymentIntent | any;

          // Ignora se for recorrente
          if (paymentIntent.subscription) break;

          const { studentId, userPlanId, userId } = paymentIntent.metadata;
          if (!studentId || !userPlanId || !userId) break;

          // Idempotência
          const existing = await prisma.charge.findFirst({
            where: { externalId: paymentIntent.id },
          });
          if (existing) break;

          await prisma.$transaction(async (tx) => {
            const charge = await createChargeService(tx, {
              studentId,
              status: ChargeStatus.PAID,
              amount: paymentIntent.amount,
              externalId: paymentIntent.id,
              description: paymentIntent.description ?? "",
              paidAt: new Date(),
            });

            const studentPlan = await createStudentPlanService(
              tx,
              { studentId, planId: userPlanId },
              userId,
            );

            await tx.charge.update({
              where: { id: charge.id },
              data: { studentPlanId: studentPlan.id },
            });
          });

          break;
        }

        /**
         * ==========================================
         * ASSINATURA CRIADA (primeiro pagamento)
         * ==========================================
         */
        case "customer.subscription.created": {
          const subscription = event.data.object as Stripe.Subscription;

          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) break;

          // Idempotência
          const existing = await prisma.charge.findFirst({
            where: { externalId: subscription.id },
          });
          if (existing) break;

          // Cria charge inicial
          await prisma.$transaction(async (tx) => {
            await createChargeService(tx, {
              studentId,
              status:
                subscription.status === "active"
                  ? ChargeStatus.PAID
                  : ChargeStatus.PENDING,
              amount: subscription.items.data[0].price.unit_amount ?? 0,
              externalId: subscription.id,
              description: "Assinatura inicial",
              paidAt: subscription.status === "active" ? new Date() : undefined,
            });

            await createStudentPlanService(
              tx,
              { studentId, planId: userPlanId },
              userId,
            );
          });

          break;
        }

        /**
         * ==========================================
         * ASSINATURA RENOVAÇÃO (invoice pago)
         * ==========================================
         */
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice | any;

          // Se não for assinatura, ignora
          if (
            !invoice.subscription ||
            typeof invoice.subscription !== "string"
          ) {
            console.log(
              "[Webhook] Invoice has no subscription, ignoring:",
              invoice.id,
            );
            break;
          }

          // Procura charge pendente
          const charge = await prisma.charge.findFirst({
            where: { externalId: invoice.id, status: ChargeStatus.PENDING },
          });
          if (!charge) {
            console.log(
              "[Webhook] Pending charge not found for invoice:",
              invoice.id,
            );
            break;
          }

          // Recupera subscription para metadata
          const subscription = await stripe.subscriptions.retrieve(
            invoice.subscription,
          );
          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) {
            console.log(
              "[Webhook] Subscription metadata missing, ignoring invoice:",
              invoice.id,
            );
            break;
          }

          await prisma.$transaction(async (tx) => {
            await markChargePaidService(tx, {
              chargeId: charge.id,
              externalId: charge.externalId!,
              studentPlanId: charge.studentPlanId!,
            });

            // await createStudentPlanService(
            //   tx,
            //   { studentId, planId: userPlanId },
            //   userId,
            // );
          });

          break;
        }

        /**
         * ==========================================
         * PAGAMENTO RECORRENTE FALHOU
         * ==========================================
         */
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice;
          console.log("[Webhook] Recurring payment failed:", invoice.id);

          // Aqui você pode marcar studentPlan/charge como PAST_DUE
          break;
        }

        /**
         * ==========================================
         * ASSINATURA CANCELADA
         * ==========================================
         */
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log("[Webhook] Subscription canceled:", subscription.id);

          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) {
            console.log(
              "[CONNECT-Webhook] Missing subscription metadata, ignoring",
            );
            break;
          }

          // Busca o plano ativo do aluno
          const activeStudentPlan = await prisma.studentPlan.findFirst({
            where: {
              studentId,
              planId: userPlanId,
              status: "ACTIVE", // ou StudentPlanStatus.ACTIVE
              endDate: { gte: new Date() }, // planos ainda ativos
            },
            select: { id: true },
          });

          if (!activeStudentPlan) {
            console.log(
              `[CONNECT-Webhook] No active studentPlan found for student ${studentId}`,
            );
            break;
          }

          // Cancela o plano
          await prisma.$transaction(async (tx) => {
            await cancelStudentPlanService(tx, activeStudentPlan.id, userId);
          });

          console.log(
            `[CONNECT-Webhook] StudentPlan ${activeStudentPlan.id} canceled successfully`,
          );
          break;
        }

        default:
          console.log(
            "[CONNECT-Webhook] Event received but ignored:",
            event.type,
          );
      }

      return res.sendStatus(200);
    } catch (err) {
      console.error("[Webhook] Error:", err);
      return res.sendStatus(500);
    }
  },
);

export default router;
