import { z } from "zod";
import config from "../config/config.js";
import { prisma } from "../lib/prisma.js";
import { Request, Response, Router } from "express";
import express from "express";
import Stripe from "stripe";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import { createChargeService } from "../services/charges.services.js";
import { ChargeStatus } from "@prisma/client";

const router: Router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

const checkoutSchema = z.object({
  studentId: z.uuid(),
  userPlanId: z.uuid(),
});

router.post(
  "/checkout/studentplan",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  async (req: Request, res: Response) => {
    const user = res.locals.user;
    const { studentId, userPlanId } = checkoutSchema.parse(req.body);

    //Make sure there is a Student
    await prisma.student.findFirstOrThrow({
      where: { id: studentId, userId: user.id },
    });

    const userPlan = await prisma.userPlan.findFirstOrThrow({
      where: { id: userPlanId, userId: user.id },
      select: {
        id: true,
        stripePriceId: true,
        stripeAccountId: true,
        price: true,
      },
    });

    // Reuso de charge PENDING
    // let charge = await prisma.charge.findFirst({
    //   where: { studentId, status: ChargeStatus.PENDING },
    // });

    // // Se não houver PENDING, cria nova charge
    // if (!charge) {
    //   const newCharge = await prisma.$transaction(async (tx) => {
    //     return createChargeService(tx, {
    //       studentId,
    //       amount: userPlan.price,
    //     });
    //   });
    //   charge = newCharge;
    // }
    const charge = await prisma.$transaction(async (tx) => {
      return createChargeService(tx, {
        studentId,
        amount: userPlan.price,
      });
    });

    // Get the price's type from Stripe
    const price = await stripe.prices.retrieve(userPlan.stripePriceId, {
      stripeAccount: userPlan!.stripeAccountId!, // Retrieve price from the connected account
    });

    const priceType = price.type;
    const mode = priceType === "recurring" ? "subscription" : "payment";
    console.log(mode);

    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price: userPlan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: mode,

        // Defines where Stripe will redirect a customer after successful payment
        success_url: `${config.baseurl}/done?session_id={CHECKOUT_SESSION_ID}`,
        // Defines where Stripe will redirect if a customer cancels payment
        cancel_url: `${config.baseurl}`,
        ...(mode === "subscription"
          ? {
              subscription_data: {},
            }
          : {
              payment_intent_data: {
                metadata: {
                  studentId,
                  userPlanId,
                  userId: user!.id,
                  chargeId: charge.id,
                },
              },
            }),
      },
      {
        stripeAccount: userPlan.stripeAccountId!,
      },
    );

    // Return the checkout session url
    return res
      .status(200)
      .json({ checkoutUrl: session.url, chargeId: charge.id });
  },
);
// router.post(
//   "/checkout/studentplan",
//   jwtCheck,
//   requireAuth,
//   getCurrentUser,
//   async (req: Request, res: Response) => {
//     const user = res.locals.user;
//     const { studentId, userPlanId } = checkoutSchema.parse(req.body);

//     // Confirma que o student pertence ao usuário
//     await prisma.student.findFirstOrThrow({
//       where: { id: studentId, userId: user.id },
//     });

//     const userPlan = await prisma.userPlan.findFirstOrThrow({
//       where: { id: userPlanId, userId: user.id },
//       select: {
//         id: true,
//         stripePriceId: true,
//         stripeAccountId: true,
//         price: true,
//       },
//     });

//     // Reuso de charge PENDING
//     let charge = await prisma.charge.findFirst({
//       where: { studentId, status: ChargeStatus.PENDING },
//     });

//     // Se não houver PENDING, cria nova charge
//     if (!charge) {
//       charge = await prisma.$transaction(async (tx) => {
//         return createChargeService(tx, {
//           studentId,
//           amount: userPlan.price,
//         });
//       });
//     }

//     // Recupera a session atual se houver
//     let session;
//     if (charge.checkoutSessionId) {
//       try {
//         session = await stripe.checkout.sessions.retrieve(
//           charge.checkoutSessionId,
//           { stripeAccount: userPlan.stripeAccountId },
//         );
//       } catch (err) {
//         session = null; // Session expirou ou foi cancelada
//       }
//     }

//     // Cria nova session se não existir ou estiver inválida
//     if (!session || !session.url) {
//       session = await stripe.checkout.sessions.create(
//         {
//           line_items: [{ price: userPlan.stripePriceId, quantity: 1 }],
//           mode: "payment",
//           payment_intent_data: {
//             metadata: {
//               studentId,
//               userPlanId,
//               userId: user.id,
//               chargeId: charge.id,
//             },
//           },
//           metadata: {
//             studentId,
//             userPlanId,
//             userId: user.id,
//             chargeId: charge.id,
//           },
//           success_url: `${config.baseurl}/done?session_id={CHECKOUT_SESSION_ID}`,
//           cancel_url: `${config.baseurl}`,
//         },
//         { stripeAccount: userPlan.stripeAccountId },
//       );

//       // Atualiza checkoutSessionId no banco
//       await prisma.charge.update({
//         where: { id: charge.id },
//         data: { checkoutSessionId: session.id },
//       });
//     }

//     // Retorna link válido pro front
//     return res.status(200).json({
//       checkoutUrl: session.url,
//       chargeId: charge.id,
//     });
//   },
// );

export default router;
