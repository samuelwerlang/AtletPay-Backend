import express from "express";
import { jwtCheck } from "../middlewares/jwtCheck.middleware.js";
import {
  createExpenseController,
  getAllExpensesController,
  getExpenseByIdController,
  deleteExpenseController,
} from "../controllers/expenses.controller.js";
import requireAuth from "../middlewares/checkAuth.middleware.js";
import getCurrentUser from "../middlewares/getCurrentUser.middleware.js";

const router = express.Router();

router.delete(
  "/delete/expense/:id",
  jwtCheck,
  requireAuth,
  deleteExpenseController,
);
router.get(
  "/expense",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  getAllExpensesController,
);
router.get(
  "/expense/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  getExpenseByIdController,
);
router.post(
  "/expense",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  createExpenseController,
);

export default router;
