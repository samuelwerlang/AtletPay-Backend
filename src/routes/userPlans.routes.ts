import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import checkPlanLimit from "../middlewares/checkPlanLimit.middleware.js";
import { checkStripeAccount } from "../middlewares/checkStripeAcc.middleware.js";
import {
  createUserPlanController,
  getUserPlanController,
  getAllUserPlansController,
  updateUserPlanController,
  deleteUserPlanController,
} from "../controllers/userplans.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";

const router = express.Router();

router.post(
  "/plan",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  checkPlanLimit,
  createUserPlanController,
);
router.get(
  "/plans",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllUserPlansController,
);
router.get(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getUserPlanController,
);
router.patch(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  updateUserPlanController,
);
router.delete(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  deleteUserPlanController,
);

export default router;
