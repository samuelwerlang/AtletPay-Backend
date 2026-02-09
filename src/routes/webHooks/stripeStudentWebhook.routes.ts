import config from "../../config/config.js";
import { prisma } from "../../lib/prisma.js";
import Stripe from "stripe";
import express from "express";
import { Router, Request, Response } from "express";

//Services
import {
  markChargePaidService,
  markChargeFailedService,
} from "../../services/charges.services.js";
import { ChargeStatus } from "@prisma/client";

import {
  createStudentPlanService,
  IStudentPlan,
} from "../../services/studentplans.services.js";

const stripe = new Stripe(`${config.STRIPE_WEBHOOK_SECRET}`);
const router: Router = express.Router();

router.post(
  "/webhook/stripe/connect",
  express.raw({ type: "application/json" }),
  async (req: Request, res: Response) => {
    console.log("DENTRO DO WEBHOOK");
    let event = req.body;
    const endpointSecret = `${config.STRIPE_WEBHOOK_SECRET}`;

    if (endpointSecret) {
      const signature = req.headers["stripe-signature"] as string;
      try {
        event = stripe.webhooks.constructEvent(
          req.body,
          signature,
          endpointSecret,
        );
      } catch (err: any) {
        console.log(`⚠️  Webhook signature verification failed.`, err.message);
        return res.sendStatus(400);
      }
    }

    let stripeObject;
    let status;
    // Handle the event
    switch (event.type) {
      case "customer.subscription.deleted":
        stripeObject = event.data.object;
        status = stripeObject.status;
        console.log(`Subscription status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleSubscriptionDeleted(stripeObject);
        break;
      case "checkout.session.completed": {
        // const session = event.data.object as Stripe.Checkout.Session;
        // if (!session.metadata) {
        //   throw new Error("[STRIPE-PAYMENT-WEBHOOK] Session does not exist");
        // }
        // const { studentId, userPlanId, userId } = session.metadata;
        // const studentPlanDTO: IStudentPlan = {
        //   studentId: studentId,
        //   planId: userPlanId,
        // };
        // await createStudentPlanService(studentPlanDTO, userId);
        // break;
      }
      case "charge.succeeded": {
        const stripeCharge = event.data.object as Stripe.Charge;

        const { studentId, userPlanId, userId, chargeId } =
          stripeCharge.metadata;
        console.log(stripeCharge.metadata);
        if (!studentId || !userPlanId || !userId || !chargeId) {
          console.log("[CHARCE.SUCCEEDED] Incomplete Charge Metadata");
          break;
        }

        const charge = await prisma.charge.findUnique({
          where: { id: chargeId },
        });

        if (!charge || charge.status === ChargeStatus.PAID) {
          break; // Duplicate Webhook or invalid Charge
        }

        await prisma.$transaction(async (tx) => {
          const studentPlan = await createStudentPlanService(
            tx,
            {
              studentId,
              planId: userPlanId,
            },
            userId,
          );

          await markChargePaidService(tx, {
            chargeId,
            externalId: stripeCharge.id,
            paidAt: new Date(),
            studentPlanId: studentPlan.id,
          });
        });
        break;
      }

      case "checkout.session.async_payment_failed":
        stripeObject = event.data.object;
        status = stripeObject.status;
        console.log(`Checkout Session status is ${status}.`);
        // Then define and call a method to handle the subscription deleted.
        // handleCheckoutSessionFailed(stripeObject);
        break;

      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
    // Return a 200 response to acknowledge receipt of the event
    res.send();
  },
);

export default router;
