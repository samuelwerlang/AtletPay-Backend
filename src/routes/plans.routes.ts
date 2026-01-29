import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
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
  createUserPlanController,
);
router.get(
  "/plans",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  getAllUserPlansController,
);
router.get(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  getUserPlanController,
);
router.patch(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  updateUserPlanController,
);
router.delete(
  "/plan/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  deleteUserPlanController,
);

export default router;
