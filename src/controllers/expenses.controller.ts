import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import createExpenseService from "../services/expenses.services.js";
import { EXPENSE_CATEGORY } from "@prisma/client";

const expenseSchema = z.object({
  name: z.string().min(1).max(255),
  description: z.string().min(1).max(255).optional(),
  amount: z.number().int().positive(),
  date: z.date(),
  category: z.enum(EXPENSE_CATEGORY),
});

async function createExpenseController(req: Request, res: Response) {
  const parsedExpense = expenseSchema.safeParse(req.body);

  if (!parsedExpense.success) {
    return res.status(400).json({
      error: "Invalid request body",
      issues: parsedExpense.error.issues,
    });
  }

  const userAuth0Id = req.auth?.payload.sub;

  const user = await prisma.user.findUnique({
    where: { auth0Id: userAuth0Id },
  });

  try {
    const expense = await createExpenseService({
      userId: user!.id,
      ...parsedExpense.data,
    });
    return res.status(201).json(expense);
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create expense" });
  }
}

export default createExpenseController;
