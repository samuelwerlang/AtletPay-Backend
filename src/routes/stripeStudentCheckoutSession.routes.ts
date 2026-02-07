import { z } from "zod";
import config from "../config/config.js";
import { prisma } from "../lib/prisma.js";
import { Request, Response, Router } from "express";
import express from "express";
import Stripe from "stripe";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import { blockIfSubscriptionExists } from "../middlewares/blockIfSubscriptionExists.middleware.js";

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

    await prisma.student.findFirstOrThrow({
      where: { id: studentId, userId: user.id },
    });

    const userPlan = await prisma.userPlan.findFirstOrThrow({
      where: { id: userPlanId, userId: user.id },
      select: {
        stripePriceId: true,
        stripeAccountId: true,
      },
    });

    // Get the price's type from Stripe
    const price = await stripe.prices.retrieve(userPlan.stripePriceId, {
      stripeAccount: userPlan!.stripeAccountId!, // Retrieve price from the connected account
    });

    const priceType = price.type;
    const mode = priceType === "recurring" ? "subscription" : "payment";

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
              payment_intent_data: {},
            }),
      },
      {
        stripeAccount: userPlan!.stripeAccountId!,
      },
    );

    // Redirect to the Stripe hosted checkout URL
    // res.redirect(303, session.url!);
    return res.status(200).json({ checkoutUrl: `${session.url}` });
  },
);

export default router;
