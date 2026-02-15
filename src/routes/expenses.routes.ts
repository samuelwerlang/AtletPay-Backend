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
import checkSaasSubscription from "../middlewares/checkSaasSubscription.middleware.js";

const router = express.Router();

router.delete("/expense/:id", jwtCheck, requireAuth, deleteExpenseController);
router.get(
  "/expenses",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getAllExpensesController,
);
router.get(
  "/expense/:id",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  getExpenseByIdController,
);
router.post(
  "/expense",
  jwtCheck,
  requireAuth,
  getCurrentUser,
  checkSaasSubscription,
  createExpenseController,
);

export default router;
