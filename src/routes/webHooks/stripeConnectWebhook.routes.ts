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
import { recomputeStudentActiveFlag } from "../../services/students.services.js";

const stripe = new Stripe(config.STRIPE_API_KEY);
const router: Router = express.Router();

router.post(
  "/stripe/connect",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    let event: Stripe.Event;

    // Verifica assinatura do Stripe (ideal: usar um secret dedicado para Connect, ex.: STRIPE_CONNECT_WEBHOOK_SECRET)
    try {
      const signature = req.headers["stripe-signature"] as string;
      event = stripe.webhooks.constructEvent(
        req.body,
        signature,
        // Trocar para config.STRIPE_CONNECT_WEBHOOK_SECRET quando configurar um endpoint dedicado de Connect
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

            // Cria StudentPlan para compra avulsa
            const studentPlan = await createStudentPlanService(
              tx,
              { studentId, planId: userPlanId },
              userId,
            );

            // Vincula a Charge ao plano criado
            await tx.charge.update({
              where: { id: charge.id },
              data: { studentPlanId: studentPlan.id },
            });
          });

          break;
        }

        /**
         * ==========================================
         * ASSINATURA CRIADA (não cria StudentPlan aqui)
         * ==========================================
         * No modelo de um StudentPlan por fatura paga:
         * - NÃO criamos StudentPlan em subscription.created
         * - O ciclo inicial será criado em invoice.paid quando a primeira fatura for paga
         */
        case "customer.subscription.created": {
          const subscription = event.data.object as Stripe.Subscription;
          const { studentId, userPlanId, userId } = subscription.metadata || {};
          if (!studentId || !userPlanId || !userId) {
            console.log("[CONNECT-Webhook] Missing subscription metadata");
          }
          // Não cria StudentPlan aqui
          break;
        }

        /**
         * ==========================================
         * ASSINATURA RENOVAÇÃO (fatura criada)
         * ==========================================
         * Cria Charge PENDING por ciclo com externalId = invoice.id.
         * Não vinculamos a Charge a um StudentPlan aqui, pois o plano do ciclo será
         * criado em invoice.paid (após confirmação do pagamento).
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
          if (!studentId || !userPlanId || !userId) {
            console.log("[CONNECT-Webhook] Missing subscription metadata");
            break;
          }

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
            await createChargeService(tx, {
              studentId,
              status: ChargeStatus.PENDING,
              amount: unitAmount,
              externalId: invoice.id,
              description: "Fatura recorrente criada",
              // studentPlanId será vinculado em invoice.paid
            });
          });

          break;
        }

        /**
         * ==========================================
         * ASSINATURA RENOVAÇÃO (invoice pago)
         * ==========================================
         * Marca a Charge PENDING como PAID e cria um StudentPlan novo por ciclo,
         * inclusive no primeiro ciclo quando a primeira fatura é paga.
         *
         * Proteção contra ordem de eventos: se invoice.created não rodou ainda,
         * cria a Charge aqui antes de marcar como PAID.
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

          const unitAmount =
            invoice.lines?.data?.[0]?.price?.unit_amount ??
            subscription.items?.data?.[0]?.price?.unit_amount ??
            0;

          await prisma.$transaction(async (tx) => {
            // 1) Garante que a Charge existe (cria se invoice.created não rodou ainda)
            let charge = await tx.charge.findFirst({
              where: { externalId: invoice.id },
            });

            if (!charge) {
              console.log(
                "[CONNECT-Webhook] Charge not found for invoice, creating:",
                invoice.id,
              );
              charge = await createChargeService(tx, {
                studentId,
                status: ChargeStatus.PENDING,
                amount: unitAmount,
                externalId: invoice.id,
                description: "Fatura recorrente criada (via invoice.paid)",
              });
            }

            // Se a charge já está PAID, é reentrega – apenas sai
            if (charge.status === ChargeStatus.PAID) {
              console.log(
                "[CONNECT-Webhook] Charge already PAID, skipping:",
                charge.id,
              );
              return;
            }

            // 2) Cria StudentPlan do ciclo (o service expira/cancela o vigente anterior)
            const newPlan = await createStudentPlanService(
              tx,
              { studentId, planId: userPlanId },
              userId,
            );

            // 3) Marca a charge como PAID e vincula ao novo plano
            await markChargePaidService(tx, {
              chargeId: charge.id,
              externalId: charge.externalId!,
              studentPlanId: newPlan.id,
            });
          });

          break;
        }

        /**
         * ==========================================
         * PAGAMENTO RECORRENTE FALHOU
         * ==========================================
         * Proteção contra ordem de eventos: se invoice.created não rodou ainda,
         * cria a Charge aqui antes de marcar como FAILED.
         */
        case "invoice.payment_failed": {
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
          if (!studentId || !userPlanId || !userId) {
            console.log("[CONNECT-Webhook] Missing subscription metadata");
            break;
          }

          const unitAmount =
            invoice.lines?.data?.[0]?.price?.unit_amount ??
            subscription.items?.data?.[0]?.price?.unit_amount ??
            0;

          await prisma.$transaction(async (tx) => {
            // 1) Garante que a Charge existe (cria se invoice.created não rodou ainda)
            let charge = await tx.charge.findFirst({
              where: { externalId: invoice.id },
            });

            if (!charge) {
              console.log(
                "[CONNECT-Webhook] Charge not found for invoice, creating:",
                invoice.id,
              );
              charge = await createChargeService(tx, {
                studentId,
                status: ChargeStatus.PENDING,
                amount: unitAmount,
                externalId: invoice.id,
                description: "Fatura recorrente criada (via payment_failed)",
              });
            }

            // Se já está FAILED, é reentrega – sai
            if (charge.status === ChargeStatus.FAILED) {
              console.log(
                "[CONNECT-Webhook] Charge already FAILED, skipping:",
                charge.id,
              );
              return;
            }

            // 2) Marca como FAILED
            try {
              await markChargeFailedService(tx, charge.id);

              // 3) Atualiza StudentPlan para PAST_DUE e recomputa flag
              if (charge.studentPlanId) {
                const studentPlan = await tx.studentPlan.findFirst({
                  where: { id: charge.studentPlanId },
                  select: { studentId: true },
                });
                if (studentPlan) {
                  await tx.studentPlan.update({
                    where: { id: charge.studentPlanId },
                    data: { status: StudentPlanStatus.PAST_DUE },
                  });
                  await recomputeStudentActiveFlag(tx, studentPlan.studentId);
                }
              }
            } catch {
              // Fallback simples (se assinatura diferente do service):
              await tx.charge.update({
                where: { id: charge.id },
                data: { status: ChargeStatus.FAILED },
              });
            }
          });

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
              endDate: { gte: new Date() }, // planos ainda vigentes
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
