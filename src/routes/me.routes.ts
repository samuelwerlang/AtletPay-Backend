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
router.delete("/me/:id", jwtCheck, requireAuth, deleteUserController);
router.get("/me/:id", jwtCheck, getUserController);
router.patch("/me/:id", jwtCheck, requireAuth, updateUserController);

export default router;
