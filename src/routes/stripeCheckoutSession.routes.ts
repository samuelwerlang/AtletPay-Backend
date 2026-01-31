import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { Request, Response } from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/stripe-checkout-session",
  jwtCheck,
  requireAuth,
  async (req: Request, res: Response) => {
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          // Provide the exact Price ID (for example, price_1234) of the product you want to sell
          price: "{{PRICE_ID}}",
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${process.env.BASE_URL}?success=true`,
    });

    res.redirect(303, session!.url!);
  },
);
