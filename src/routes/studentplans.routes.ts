import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import {
  createStudentPlanController,
  cancelStudentPlanController,
} from "../controllers/studentplans.controller.js";

const router = express.Router();

router.post(
  "/studentplan",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  createStudentPlanController,
);

router.patch(
  "/studentplan/:studentPlanId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  cancelStudentPlanController,
);
