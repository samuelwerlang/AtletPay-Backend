import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import checkStudentReadOnly from "../middlewares/checkStudentReadOnly.middleware.js";
import {
  createDietPlanController,
  deleteDietPlanController,
  getAllDietPlansController,
  getDietPlanByIdController,
  getMealsLibraryController,
  updateDietPlanController,
} from "../controllers/dietPlans.controller.js";

const router = express.Router();

router.post(
  "/diet-plan",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  createDietPlanController,
);

router.get(
  "/diet-plans",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  getAllDietPlansController,
);

router.get(
  "/diet-plan/:dietPlanId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  getDietPlanByIdController,
);

router.patch(
  "/diet-plan/:dietPlanId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  updateDietPlanController,
);

router.delete(
  "/diet-plan/:dietPlanId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  deleteDietPlanController,
);

router.get(
  "/meals",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkStudentReadOnly,
  checkSaasSubscription,
  getMealsLibraryController,
);

export default router;
