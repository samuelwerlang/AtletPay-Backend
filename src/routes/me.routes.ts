import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createUserController,
  deleteUserController,
  getUserController,
  updateUserController,
} from "../controllers/users.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";

const router = express.Router();

router.post("/me", jwtCheck, requireAuth, createUserController);
router.get("/me", jwtCheck, requireAuth, getUserController);
router.patch("/me", jwtCheck, requireAuth, updateUserController);
router.delete("/me", jwtCheck, requireAuth, deleteUserController);

export default router;
