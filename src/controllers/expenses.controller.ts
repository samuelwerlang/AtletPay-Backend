import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import {
  createExpenseService,
  deleteExpenseService,
  getAllExpensesService,
  getExpenseByIdService,
} from "../services/expenses.services.js";
import { EXPENSE_CATEGORY } from "@prisma/client";

const expenseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255).optional(),
  amount: z.number().int().positive(),
  date: z.preprocess((arg) => {
    if (typeof arg === "string" || arg instanceof Date) {
      return new Date(arg);
    }
  }, z.date()),
  category: z.enum(EXPENSE_CATEGORY),
});

async function createExpenseController(req: Request, res: Response) {
  const parsedExpense = expenseSchema.parse(req.body);

  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const expense = await createExpenseService(parsedExpense, user.id);
  return res.status(201).json(expense);
}

async function getAllExpensesController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const userExpenses = await getAllExpensesService(user.id);
  return res.status(200).json(userExpenses);
}

async function getExpenseByIdController(req: Request, res: Response) {
  const expenseId = String(req.params.id); // pegando só o id
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const userExpense = await getExpenseByIdService(expenseId, user.id);
  return res.status(200).json(userExpense);
}

async function deleteExpenseController(req: Request, res: Response) {
  const expenseId = String(req.params.id); // pegando só o id
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const userExpense = await deleteExpenseService(expenseId, user.id);
  return res.status(200).json(userExpense);
}

export {
  createExpenseController,
  getExpenseByIdController,
  getAllExpensesController,
  deleteExpenseController,
};
