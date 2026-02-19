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
  "/userplan",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  checkPlanLimit,
  createUserPlanController,
);
router.get(
  "/userplans",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllUserPlansController,
);
router.get(
  "/userplan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getUserPlanController,
);
router.patch(
  "/userplan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  updateUserPlanController,
);
router.delete(
  "/userplan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStripeAccount,
  checkSaasSubscription,
  deleteUserPlanController,
);

export default router;
