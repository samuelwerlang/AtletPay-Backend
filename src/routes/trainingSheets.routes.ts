import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";
import {
  createTrainingSheetController,
  deleteTrainingSheetController,
  getAllTrainingSheetsController,
  getTrainingSheetByIdController,
  updateTrainingSheetController,
} from "../controllers/trainingSheets.controller.js";

const router = express.Router();

router.post(
  "/training-sheet",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  createTrainingSheetController,
);

router.get(
  "/training-sheets",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllTrainingSheetsController,
);

router.get(
  "/training-sheet/:trainingSheetId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getTrainingSheetByIdController,
);

router.patch(
  "/training-sheet/:trainingSheetId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  updateTrainingSheetController,
);

router.delete(
  "/training-sheet/:trainingSheetId",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  deleteTrainingSheetController,
);

export default router;
