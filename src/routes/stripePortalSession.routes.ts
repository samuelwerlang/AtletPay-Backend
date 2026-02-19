import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/create-portal-session",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  async (req, res) => {
    const user = res.locals.user;

    if (!user.stripeCustomerId) {
      return res.status(400).json({
        error: "User does not have a Stripe customer",
      });
    }

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: user.stripeCustomerId,
      return_url: `${config.baseurl}/callback`,
      locale: "pt-BR",
    });

    res.redirect(303, portalSession.url);
  },
);

export default router;
