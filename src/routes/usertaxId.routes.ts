import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createCPFController,
  getCPFController,
  deleteCPFController,
} from "../controllers/usertaxId.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";

const router = express.Router();

router.post("/cpf", jwtCheck, requireAuth, getCurrentUser, createCPFController);
router.get("/cpf/:id", jwtCheck, requireAuth, getCurrentUser, getCPFController);
router.delete(
  "/cpf/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  deleteCPFController,
);

export default router;
