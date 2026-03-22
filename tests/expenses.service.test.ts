const mockPrisma = {
  expense: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import {
  createExpenseService,
  getAllExpensesService,
  getExpenseByIdService,
  updateExpenseService,
  deleteExpenseService,
} from "../src/services/expenses.services.js";

describe("expenses.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates an expense for a specific user", async () => {
    const created = { id: "expense-1" };
    mockPrisma.expense.create.mockResolvedValue(created);

    const result = await createExpenseService(
      {
        name: "Academia",
        amount: 200,
        date: new Date("2026-03-16T00:00:00.000Z"),
        category: "FIXED" as any,
      },
      "user-1",
    );

    expect(result).toEqual(created);
    expect(mockPrisma.expense.create).toHaveBeenCalledWith({
      data: {
        name: "Academia",
        amount: 200,
        date: new Date("2026-03-16T00:00:00.000Z"),
        category: "FIXED",
        userId: "user-1",
      },
    });
  });

  it("lists all expenses ordered by date descending", async () => {
    const expenses = [{ id: "expense-1" }];
    mockPrisma.expense.findMany.mockResolvedValue(expenses);

    const result = await getAllExpensesService("user-1");

    expect(result).toEqual(expenses);
    expect(mockPrisma.expense.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { date: "desc" },
    });
  });

  it("gets one expense by id and user", async () => {
    const expense = { id: "expense-1" };
    mockPrisma.expense.findFirstOrThrow.mockResolvedValue(expense);

    const result = await getExpenseByIdService("expense-1", "user-1");

    expect(result).toEqual(expense);
    expect(mockPrisma.expense.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "expense-1",
        userId: "user-1",
      },
    });
  });

  it("updates one expense by id and user", async () => {
    const updated = { id: "expense-1", name: "Internet" };
    mockPrisma.expense.update.mockResolvedValue(updated);

    const result = await updateExpenseService(
      "expense-1",
      { name: "Internet" },
      "user-1",
    );

    expect(result).toEqual(updated);
    expect(mockPrisma.expense.update).toHaveBeenCalledWith({
      where: { id: "expense-1", userId: "user-1" },
      data: { name: "Internet" },
    });
  });

  it("deletes an expense only after ownership check", async () => {
    const deleted = { id: "expense-1" };
    mockPrisma.expense.findFirstOrThrow.mockResolvedValue({ id: "expense-1" });
    mockPrisma.expense.delete.mockResolvedValue(deleted);

    const result = await deleteExpenseService("expense-1", "user-1");

    expect(result).toEqual(deleted);
    expect(mockPrisma.expense.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "expense-1",
        userId: "user-1",
      },
    });
    expect(mockPrisma.expense.delete).toHaveBeenCalledWith({
      where: { id: "expense-1" },
    });
  });

  it("does not delete when ownership check fails", async () => {
    mockPrisma.expense.findFirstOrThrow.mockRejectedValue(
      new Error("Not found"),
    );

    await expect(deleteExpenseService("expense-1", "user-1")).rejects.toThrow(
      "Not found",
    );

    expect(mockPrisma.expense.delete).not.toHaveBeenCalled();
  });
});
