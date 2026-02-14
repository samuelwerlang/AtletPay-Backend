import config from "../../config/config.js";
import express from "express";
import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { jwtCheck } from "../../middlewares/jwtCheck.middleware.js";
import requireAuth from "../../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../../middlewares/getCurrentUser.middleware.js";
import { IUserData, updateUserService } from "../../services/users.service.js";

const router: Router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/create-connect-account",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  async (req: Request, res: Response) => {
    const user = res.locals.user;
    if (user.stripeAccountId) {
      return res.status(400).json({
        message: "User already has a Stripe account",
      });
    }
    if (!user) {
      return res.status(401).json({ message: "User not authenticated" });
    }
    try {
      const account = await stripe.v2.core.accounts.create({
        display_name: user.name,
        contact_email: user.email,
        dashboard: "full",
        defaults: {
          responsibilities: {
            fees_collector: "stripe",
            losses_collector: "stripe",
          },
        },
        identity: {
          country: "BR",
          entity_type: "individual",
        },
        configuration: {
          // customer: {},
          merchant: {
            capabilities: {
              card_payments: { requested: true },
            },
          },
        },
      });

      const userDTO: IUserData = {
        sub: user.auth0Id,
        email: user.email,
        name: user.name,
        stripeAccountId: account?.id,
      };
      await updateUserService(userDTO);

      return res.json({ accountId: account.id });
    } catch (error: any) {
      return res.status(500).json({ message: error.message });
    }
  },
);

export default router;
