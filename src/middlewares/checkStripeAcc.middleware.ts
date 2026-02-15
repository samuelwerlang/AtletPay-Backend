import config from "../config/config.js";
import { Request, Response, NextFunction } from "express";
import Stripe from "stripe";

const stripe = new Stripe(config.STRIPE_API_KEY);

async function checkStripeAccount(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  try {
    const user = res.locals.user;
    const stripeAccountId = user.stripeAccountId;
    const stripeAccount = await stripe.accounts.retrieve(`${stripeAccountId}`);

    if (!stripeAccountId) {
      return res.status(404).json({
        stripeAccountMiddleware: "User has no connected Stripe account",
      });
    }
    if (!stripeAccount) {
      return res
        .status(404)
        .json({ stripeAccountMiddleware: "User's stripe account not found" });
    }
    if (!stripeAccount.details_submitted) {
      return res.status(403).json({
        stripeAccountMiddleware: "Stripe account information missing",
      });
    }
    if (stripeAccount.requirements?.past_due?.length! > 0) {
      return res.status(403).json({
        stripeAccountMiddleware: "Stripe account has pendind requirements",
      });
    }

    if (stripeAccount.capabilities?.card_payments !== "active") {
      return res.status(403).json({
        stripeAccountMiddleware: "Card payments not available",
      });
    }

    return next();
  } catch (error: any) {
    console.error(`Error checking Stripe account ${error.message}`);
    return res.status(500).json({
      stripeAccountMiddleware: "Error verifying Stripe account status",
      error: error.message,
    });
  }
}

export { checkStripeAccount };
