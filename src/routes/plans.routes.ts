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
<<<<<<< HEAD

const router = express.Router();

router.post("/plan", jwtCheck, requireAuth, createUserPlanController);
router.get("/plans", jwtCheck, requireAuth, getAllUserPlansController);
router.get("/plan/:id", jwtCheck, requireAuth, getUserPlanController);
router.patch("/plan/:id", jwtCheck, requireAuth, updateUserPlanController);
router.delete("/plan/:id", jwtCheck, requireAuth, deleteUserPlanController);
=======
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
>>>>>>> backend-setup

export default router;
