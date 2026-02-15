import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../services/subscriptions.services.js";

const router = express.Router();

router.post("/subscription", jwtCheck, requireAuth, createSubscriptionService);
