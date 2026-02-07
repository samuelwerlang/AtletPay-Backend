import config from "../config/config.js";
import express from "express";
import { Request, Response, Router } from "express";
import Stripe from "stripe";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import { IUserData, updateUserService } from "../services/users.service.js";

const router: Router = express.Router();
const stripe = new Stripe(config.STRIPE_API_KEY);

router.post(
  "/create-account-link",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  async (req: Request, res: Response) => {
    const user = res.locals.user;
    if (!user) {
      console.warn("[CREATE-ACCOUNT-LINK] User not found");
      return res.status(400).json({ message: "Stripe account not found" });
    }
    const accountId = user.stripeAccountId;
    try {
      const accountLink = await stripe.v2.core.accountLinks.create({
        account: accountId,
        use_case: {
          type: "account_onboarding",
          account_onboarding: {
            configurations: ["merchant"],
            refresh_url: `${config.baseurl}`,
            return_url: `${config.baseurl}?accountId=${accountId}`,
          },
        },
      });
      res.json({ url: accountLink.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  },
);

export default router;
