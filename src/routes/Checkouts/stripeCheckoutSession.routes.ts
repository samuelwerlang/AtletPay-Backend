import config from "../../config/config.js";
import { prisma } from "../../lib/prisma.js";
import express from "express";
import Stripe from "stripe";
import getCurrentUser from "../../middlewares/getCurrentUser.middleware.js";
import { jwtCheck } from "../../middlewares/jwtCheck.middleware.js";
import requireAuth from "../../middlewares/checkAuth.middleware.js";
import { blockIfSubscriptionExists } from "../../middlewares/blockIfSubscriptionExists.middleware.js";
import checkSaasSubscription from "../../middlewares/checkSaasSubscription.middleware.js";
import blockStudentBilling from "../../middlewares/blockStudentBilling.middleware.js";

const router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

// export default router;
router.post(
  "/create-checkout-session",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  blockStudentBilling,
  blockIfSubscriptionExists,
  async (req, res) => {
    console.log("CHECKOUT SESSION ROUTE CALLED");
    let user = res.locals.user;
    if (!user) {
      return res.status(500).json({
        message:
          "(CHECKOUT-SESSION-ROUTE): Could not find user in response context",
      });
    }

    //Cria customer no Stripe se não existir
    if (!user.stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.name,
        tax_exempt: "none",
        address: {
          country: "BR",
        },
      });
      //Atualiza user no banco
      user = await prisma.user.update({
        where: { id: user.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Diagnostico: se o customer ja tiver tax ID salvo, o Checkout nao mostra o formulario novamente.
    try {
      const customerTaxIds = await stripe.customers.listTaxIds(user.stripeCustomerId, {
        limit: 5,
      });
      console.log("[CHECKOUT] Existing customer tax IDs:", {
        customerId: user.stripeCustomerId,
        count: customerTaxIds.data.length,
        types: customerTaxIds.data.map((t) => t.type),
      });
    } catch (err) {
      console.warn("[CHECKOUT] Could not list customer tax IDs", err);
    }

    // Lista preços
    const prices = await stripe.prices.list({
      lookup_keys: [req.body.lookup_key],
      expand: ["data.product"],
    });

    if (!prices.data.length) {
      return res.status(400).json({ message: "Invalid plan" });
    }

    // Cria checkout session
    const session = await stripe.checkout.sessions.create({
      line_items: [
        {
          price: prices.data[0].id,
          quantity: 1,
        },
      ],
      mode: "subscription",
      billing_address_collection: "required",
      tax_id_collection: {
        enabled: true,
      },
      customer_update: {
        name: "auto",
        address: "auto",
      },
      customer: user.stripeCustomerId, // sempre existe
      // client_reference_id: user.id,
      locale: "pt-BR",
      success_url: `${config.baseurl}/?success=true&session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${config.baseurl}/billing`,
    });

    res.redirect(303, session.url!);
  },
);

export default router;
