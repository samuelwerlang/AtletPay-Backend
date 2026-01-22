import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createExpenseController,
  getAllExpensesController,
  getExpenseByIdController,
  deleteExpenseController,
} from "../controllers/expenses.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";

const router = express.Router();

router.delete(
  "/delete/expense/:id",
  jwtCheck,
  requireAuth,
  deleteExpenseController,
);
router.get("/expense", jwtCheck, requireAuth, getAllExpensesController);
router.get("/expense/:id", jwtCheck, requireAuth, getExpenseByIdController);
router.post("/expense", jwtCheck, requireAuth, createExpenseController);

export default router;
