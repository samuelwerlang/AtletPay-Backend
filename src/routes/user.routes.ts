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

router.post("/user", jwtCheck, requireAuth, createUserController);
router.delete("/user", jwtCheck, requireAuth, deleteUserController);
router.get("/user", jwtCheck, getUserController);
router.patch("/user", jwtCheck, requireAuth, updateUserController);

export default router;
