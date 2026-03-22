import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import {
  createExerciseController,
  deleteExerciseController,
  getAllExercisesController,
  getExerciseByIdController,
  updateExerciseController,
} from "../controllers/exercises.controller.js";

const router = express.Router();

router.post(
  "/exercise",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  createExerciseController,
);

router.get(
  "/exercises",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllExercisesController,
);

router.get(
  "/exercise/:exerciseId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getExerciseByIdController,
);

router.patch(
  "/exercise/:exerciseId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  updateExerciseController,
);

router.delete(
  "/exercise/:exerciseId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  deleteExerciseController,
);

export default router;
