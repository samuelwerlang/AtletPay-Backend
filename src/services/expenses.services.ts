import { prisma } from "../lib/prisma.js";
import { EXPENSE_CATEGORY } from "@prisma/client";

export interface ICreateExpense {
  name: string;
  description?: string;
  amount: number;
  date: Date;
  category: EXPENSE_CATEGORY;
}

export interface IUpdateExpense {
  name?: string;
  description?: string;
  amount?: number;
  date?: Date;
  category?: EXPENSE_CATEGORY;
}

async function createExpenseService(data: ICreateExpense, userId: string) {
  return prisma.expense.create({
    data: {
      ...data,
      userId,
    },
  });
}

async function getAllExpensesService(userId: string) {
  return prisma.expense.findMany({
    where: { userId },
    orderBy: { date: "desc" },
  });
}

async function getExpenseByIdService(expenseId: string, userId: string) {
  return prisma.expense.findFirstOrThrow({
    where: {
      id: expenseId,
      userId,
    },
  });
}

async function updateExpenseService(
  expenseId: string,
  data: IUpdateExpense,
  userId: string,
) {
  return prisma.expense.update({
    where: { id: expenseId },
    data,
  });
}

async function deleteExpenseService(expenseId: string, userId: string) {
  await prisma.expense.findFirstOrThrow({
    where: {
      id: expenseId,
      userId,
    },
  });

  return prisma.expense.delete({
    where: { id: expenseId },
  });
}

export {
  createExpenseService,
  getAllExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
};
