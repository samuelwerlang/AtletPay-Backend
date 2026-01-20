import express from "express";
import { jwtCheck } from "../middlewares/auth.middleware.js";
import createExpenseController from "../controllers/expenses.controller.js";

const router = express.Router();

router.post("/expense", jwtCheck, createExpenseController);
