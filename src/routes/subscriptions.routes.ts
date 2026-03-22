import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import blockStudentBilling from "../middlewares/blockStudentBilling.middleware.js";
import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../services/subscriptions.services.js";

const router = express.Router();

router.post(
  "/subscription",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  blockStudentBilling,
  createSubscriptionService,
);
