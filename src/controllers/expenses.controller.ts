import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import { createExpenseService } from "../services/expenses.services.js";
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

  const userAuth0Id = req.auth?.payload.sub;

  const user = await prisma.user.findUnique({
    where: { auth0Id: userAuth0Id },
  });

  const expense = await createExpenseService(parsedExpense, user!.id);
  return res.status(201).json(expense);
}

export default createExpenseController;
