import { prisma } from "../lib/prisma.js";
import { EXPENSE_CATEGORY } from "@prisma/client";

interface IExpense {
  name: string;
  description?: string | undefined;
  amount: number;
  date: Date;
  category: EXPENSE_CATEGORY;
  userId: string;
}

async function createExpenseService(expense: IExpense) {
  const { name, description, amount, date, category, userId } = expense;

  if (!name || !amount || !date || !category || !userId) {
    throw new Error("Missing required expense fields");
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
  });

  const newExpense = await prisma.expense.create({
    data: {
      userId: user!.id,
      name,
      description,
      amount,
      date,
      category,
    },
  });
  return newExpense;
}

export default createExpenseService;
