import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import { blockIfSubscriptionExists } from "../middlewares/blockIfSubscriptionExists.middleware.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/create-checkout-session",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  blockIfSubscriptionExists,
  async (req, res) => {
    const user = res.locals.user;
    if (!user) {
      return res.status(500).json({
        message:
          "(CHECKOUT-SESSION-ROUTE): Could not find user in response context",
      });
    }

    const prices = await stripe.prices.list({
      lookup_keys: [req.body.lookup_key],
      expand: ["data.product"],
    });

    if (!prices.data.length) {
      return res.status(400).json({ message: "Invalid plan" });
    }

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
      ...(user!.stripeCustomerId && { customer: user!.stripeCustomerId }),
      client_reference_id: user!.id,
      locale: "pt-BR",
      success_url: `${config.baseurl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseurl}/billing`,
    });

    res.redirect(303, session!.url!);
  },
);

export default router;
