import { z } from "zod";
import config from "../../config/config.js";
import { prisma } from "../../lib/prisma.js";
import { Request, Response, Router } from "express";
import express from "express";
import Stripe from "stripe";
import getCurrentUser from "../../middlewares/getCurrentUser.middleware.js";
import { jwtCheck } from "../../middlewares/jwtCheck.middleware.js";
import requireAuth from "../../middlewares/checkAuth.middleware.js";
import checkSaasSubscription from "../../middlewares/checkSaasSubscription.middleware.js";
import { checkStripeAccount } from "../../middlewares/checkStripeAcc.middleware.js";

const router: Router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

const checkoutSchema = z.object({
  studentId: z.uuid(),
  userPlanId: z.uuid(),
});

router.post(
  "/checkout/connect",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  checkStripeAccount,
  async (req: Request, res: Response) => {
    const user = res.locals.user;
    const { studentId, userPlanId } = checkoutSchema.parse(req.body);

    const activePlan = await prisma.studentPlan.findFirst({
      where: {
        studentId,
        status: "ACTIVE",
        endDate: {
          gt: new Date(),
        },
        // ou o status que você usa para plano ativo
      },
    });

    if (activePlan) {
      return res.status(400).json({
        message:
          "Aluno já possui um plano ativo. Não é possível criar nova assinatura.",
      });
    }

    // Confirma que o student pertence ao usuário
    await prisma.student.findFirstOrThrow({
      where: { id: studentId, userId: user.id },
    });

    const userPlan = await prisma.userPlan.findFirstOrThrow({
      where: { id: userPlanId, userId: user.id },
      select: {
        id: true,
        stripePriceId: true,
        stripeAccountId: true,
      },
    });

    const price = await stripe.prices.retrieve(userPlan.stripePriceId, {
      stripeAccount: userPlan.stripeAccountId!,
    });

    const mode = price.type === "recurring" ? "subscription" : "payment";

    const session = await stripe.checkout.sessions.create(
      {
        line_items: [
          {
            price: userPlan.stripePriceId,
            quantity: 1,
          },
        ],
        mode,

        success_url: `${config.baseurl}/done?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${config.baseurl}`,

        ...(mode === "subscription"
          ? {
              subscription_data: {
                metadata: {
                  studentId,
                  userPlanId,
                  userId: user.id,
                },
              },
            }
          : {
              payment_intent_data: {
                metadata: {
                  studentId,
                  userPlanId,
                  userId: user.id,
                },
              },
            }),
      },
      {
        stripeAccount: userPlan.stripeAccountId!,
      },
    );

    return res.status(200).json({
      checkoutUrl: session.url,
    });
  },
);

export default router;
