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
router.delete("/me", jwtCheck, requireAuth, deleteUserController);
router.get("/me", jwtCheck, getUserController);
router.patch("/me", jwtCheck, requireAuth, updateUserController);

export default router;
