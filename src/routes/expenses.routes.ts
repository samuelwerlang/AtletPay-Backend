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

router.post("/expense", jwtCheck, requireAuth, createExpenseController);
router.get("/expenses", jwtCheck, requireAuth, getAllExpensesController);
router.get("/expense/:id", jwtCheck, requireAuth, getExpenseByIdController);
router.delete("/expense/:id", jwtCheck, requireAuth, deleteExpenseController);

export default router;
