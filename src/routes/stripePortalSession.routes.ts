import config from "../config/config.js";
import express from "express";
import Stripe from "stripe";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post("/create-portal-session", async (req, res) => {
  // For demonstration purposes, we're using the Checkout session to retrieve the customer_account ID.
  // Typically this is stored alongside the authenticated user in your database.
  const { session_id } = req.body;
  const checkoutSession = await stripe.checkout.sessions.retrieve(session_id);

  // This is the url to which the customer will be redirected when they're done
  // managing their billing with the portal.
  const returnUrl = config.baseurl;

  // Validate that customer exists and extract the ID if it's an object
  const customerId =
    typeof checkoutSession.customer === "string"
      ? checkoutSession.customer
      : checkoutSession.customer?.id;

  if (!customerId) {
    return res
      .status(400)
      .json({ error: "Customer not found in checkout session" });
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
    locale: "pt-BR",
  });

  res.redirect(303, portalSession.url);
});

export default router;
