import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createUserController,
  deleteUserController,
} from "../controllers/users.controller.js";

const router = express.Router();

router.post("/user", jwtCheck, createUserController);
router.delete("/user", jwtCheck, deleteUserController);

export default router;
