import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { Request, Response } from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post("/create-checkout-session", async (req, res) => {
  const prices = await stripe.prices.list({
    lookup_keys: [req.body.lookup_key],
    expand: ["data.product"],
  });
  const session = await stripe.checkout.sessions.create({
    billing_address_collection: "auto",
    line_items: [
      {
        price: prices.data[0].id,
        // For usage-based billing, don't pass quantity
        quantity: 1,
      },
    ],
    mode: "subscription",
    locale: "pt-BR",
    success_url: `${config.baseurl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
  });

  res.redirect(303, session!.url!);
});

export default router;
