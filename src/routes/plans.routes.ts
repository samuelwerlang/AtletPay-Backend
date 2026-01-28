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

const router = express.Router();

router.post("/plan", jwtCheck, requireAuth, createUserPlanController);
router.get("/plans", jwtCheck, requireAuth, getAllUserPlansController);
router.get("/plan/:id", jwtCheck, requireAuth, getUserPlanController);
router.patch("/plan/:id", jwtCheck, requireAuth, updateUserPlanController);
router.delete("/plan/:id", jwtCheck, requireAuth, deleteUserPlanController);

export default router;
