import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import createExpenseController from "../controllers/expenses.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";

const router = express.Router();

router.post("/expense", jwtCheck, requireAuth, createExpenseController);

export default router;
