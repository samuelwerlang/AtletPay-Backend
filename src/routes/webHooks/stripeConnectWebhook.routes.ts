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

    // Verifica assinatura do Stripe (ideal: usar um secret dedicado para Connect, ex.: STRIPE_CONNECT_WEBHOOK_SECRET)
    try {
      const signature = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        // Troque para config.STRIPE_CONNECT_WEBHOOK_SECRET quando configurar um endpoint dedicado de Connect
        config.STRIPE_WEBHOOK_SECRET,
      );
    } catch (err: any) {
      console.error(
        "[CONNECT-Webhook] Signature verification failed:",
        err.message,
      );
      return res.sendStatus(400);
    }

    try {
      // Em webhooks de Connect, o ID da conta conectada vem em event.account
      const connectAccountId = (event as any)?.account as string | undefined;

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

          const { studentId, userPlanId, userId } =
            paymentIntent.metadata || {};
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
         * ASSINATURA CRIADA (vínculo do aluno ao plano)
         * ==========================================
         * Não criamos Charge aqui, pois a fatura inicial ainda pode não existir.
         * As Charges recorrentes serão criadas em invoice.created com externalId = invoice.id.
         */
        case "customer.subscription.created": {
          const subscription = event.data.object as Stripe.Subscription;
          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) break;

          await prisma.$transaction(async (tx) => {
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
         * ASSINATURA RENOVAÇÃO (fatura criada)
         * ==========================================
         * Cria Charge PENDING por ciclo com externalId = invoice.id
         */
        case "invoice.created": {
          const invoice = event.data.object as Stripe.Invoice | any;
          if (!invoice.subscription) break;

          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              ...(connectAccountId ? { stripeAccount: connectAccountId } : {}),
            },
          );

          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) break;

          // Idempotência: uma Charge por invoice.id
          const exists = await prisma.charge.findFirst({
            where: { externalId: invoice.id },
          });
          if (exists) break;

          const unitAmount =
            invoice.lines?.data?.[0]?.price?.unit_amount ??
            subscription.items?.data?.[0]?.price?.unit_amount ??
            0;

          await prisma.$transaction(async (tx) => {
            // Opcional: localizar o StudentPlan ativo para vincular a Charge
            const studentPlan = await tx.studentPlan.findFirst({
              where: {
                studentId,
                planId: userPlanId,
                status: StudentPlanStatus.ACTIVE,
              },
              orderBy: { createdAt: "desc" },
              select: { id: true },
            });

            await createChargeService(tx, {
              studentId,
              status: ChargeStatus.PENDING,
              amount: unitAmount,
              externalId: invoice.id,
              description: "Fatura recorrente criada",
              ...(studentPlan?.id ? { studentPlanId: studentPlan.id } : {}),
            });
          });

          break;
        }

        /**
         * ==========================================
         * ASSINATURA RENOVAÇÃO (invoice pago)
         * ==========================================
         * Marca a Charge PENDING como PAID procurando por externalId = invoice.id
         * Mantém fallback para a primeira cobrança caso tenha sido criada com subscription.id
         */
        case "invoice.paid": {
          const invoice = event.data.object as Stripe.Invoice | any;

          // Se não for assinatura, ignora
          if (!invoice.subscription) {
            console.log(
              "[CONNECT-Webhook] Invoice has no subscription, ignoring:",
              invoice.id,
            );
            break;
          }

          // Procura charge pendente pela invoice.id
          let charge = await prisma.charge.findFirst({
            where: { externalId: invoice.id, status: ChargeStatus.PENDING },
          });

          // Fallback (caso inicial tenha sido criada com subscription.id)
          if (!charge) {
            const subscriptionId =
              typeof invoice.subscription === "string"
                ? invoice.subscription
                : invoice.subscription?.id;
            if (subscriptionId) {
              charge = await prisma.charge.findFirst({
                where: {
                  externalId: subscriptionId,
                  status: ChargeStatus.PENDING,
                },
              });
            }
          }

          if (!charge) {
            console.log(
              "[CONNECT-Webhook] Pending charge not found for invoice:",
              invoice.id,
            );
            break;
          }

          // Recupera subscription para metadata
          const subscriptionId =
            typeof invoice.subscription === "string"
              ? invoice.subscription
              : invoice.subscription.id;

          const subscription = await stripe.subscriptions.retrieve(
            subscriptionId,
            {
              ...(connectAccountId ? { stripeAccount: connectAccountId } : {}),
            },
          );

          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) {
            console.log(
              "[CONNECT-Webhook] Subscription metadata missing, ignoring invoice:",
              invoice.id,
            );
            break;
          }

          await prisma.$transaction(async (tx) => {
            await markChargePaidService(tx, {
              chargeId: charge!.id,
              externalId: charge!.externalId!,
              studentPlanId: charge!.studentPlanId!,
            });
          });

          break;
        }

        /**
         * ==========================================
         * PAGAMENTO RECORRENTE FALHOU
         * ==========================================
         */
        case "invoice.payment_failed": {
          const invoice = event.data.object as Stripe.Invoice | any;

          // Marca Charge como PAST_DUE, se existir
          const charge = await prisma.charge.findFirst({
            where: { externalId: invoice.id },
          });

          if (charge) {
            await prisma.$transaction(async (tx) => {
              try {
                await markChargeFailedService(tx, charge.id);
                if (charge.studentPlanId) {
                  await tx.studentPlan.update({
                    where: { id: charge.studentPlanId },
                    data: { status: StudentPlanStatus.PAST_DUE },
                  });
                }
              } catch {
                // Se o service tiver assinatura diferente, fallback simples:
                await tx.charge.update({
                  where: { id: charge.id },
                  data: { status: ChargeStatus.FAILED },
                });
              }
            });
          } else {
            console.log(
              "[CONNECT-Webhook] Charge not found for failed invoice:",
              invoice.id,
            );
          }

          break;
        }

        /**
         * ==========================================
         * ASSINATURA CANCELADA
         * ==========================================
         */
        case "customer.subscription.deleted": {
          const subscription = event.data.object as Stripe.Subscription;
          console.log(
            "[CONNECT-Webhook] Subscription canceled:",
            subscription.id,
          );

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
              status: StudentPlanStatus.ACTIVE,
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
      console.error("[CONNECT-Webhook] Error:", err);
      return res.sendStatus(500);
    }
  },
);

export default router;
