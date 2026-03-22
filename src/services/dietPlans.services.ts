import { prisma } from "../lib/prisma.js";
import { Prisma } from "@prisma/client";

interface IMealInput {
  id?: string;
  name: string;
  quantity?: string;
  kcal?: number;
  substitutes?: string;
  notes?: string;
  mealTime?: string;
  mealOrder?: number;
  planMealNotes?: string;
}

interface ICreateDietPlanInput {
  name: string;
  description?: string;
  startDate: Date;
  endDate?: Date;
  studentId: string;
  meals: IMealInput[];
}

interface IUpdateDietPlanInput {
  name?: string;
  description?: string;
  startDate?: Date;
  endDate?: Date;
  meals?: IMealInput[];
}

async function ensureStudentBelongsToUser(userId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, userId },
    select: { id: true },
  });

  if (!student) {
    throw new Error("Student not found");
  }
}

async function upsertMealForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  meal: IMealInput,
) {
  if (meal.id) {
    const existingMeal = await tx.meal.findFirst({
      where: { id: meal.id, userId },
      select: { id: true },
    });

    if (!existingMeal) {
      throw new Error("Meal not found");
    }

    return existingMeal;
  }

  return tx.meal.create({
    data: {
      name: meal.name,
      quantity: meal.quantity,
      kcal: meal.kcal,
      substitutes: meal.substitutes,
      notes: meal.notes,
      userId,
    },
    select: { id: true },
  });
}

async function createDietPlanService(userId: string, payload: ICreateDietPlanInput) {
  await ensureStudentBelongsToUser(userId, payload.studentId);

  return prisma.$transaction(async (tx) => {
    const plan = await tx.dietPlan.create({
      data: {
        name: payload.name,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
        userId,
        studentId: payload.studentId,
      },
      select: { id: true },
    });

    for (let i = 0; i < payload.meals.length; i += 1) {
      const mealInput = payload.meals[i];
      const meal = await upsertMealForUser(tx, userId, mealInput);

      await tx.dietPlanMeal.create({
        data: {
          dietPlanId: plan.id,
          mealId: meal.id,
          mealOrder: mealInput.mealOrder ?? i,
          mealTime: mealInput.mealTime,
          notes: mealInput.planMealNotes,
        },
      });
    }

    return tx.dietPlan.findUniqueOrThrow({
      where: { id: plan.id },
      include: {
        meals: {
          orderBy: { mealOrder: "asc" },
          include: { meal: true },
        },
      },
    });
  });
}

async function getAllDietPlansService(userId: string, studentId?: string) {
  if (studentId) {
    await ensureStudentBelongsToUser(userId, studentId);
  }

  return prisma.dietPlan.findMany({
    where: {
      userId,
      ...(studentId ? { studentId } : {}),
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      meals: {
        orderBy: { mealOrder: "asc" },
        include: { meal: true },
      },
    },
  });
}

async function getDietPlanByIdService(userId: string, dietPlanId: string) {
  const plan = await prisma.dietPlan.findFirst({
    where: { id: dietPlanId, userId },
    include: {
      meals: {
        orderBy: { mealOrder: "asc" },
        include: { meal: true },
      },
    },
  });

  if (!plan) {
    throw new Error("Diet plan not found");
  }

  return plan;
}

async function updateDietPlanService(
  userId: string,
  dietPlanId: string,
  payload: IUpdateDietPlanInput,
) {
  const existing = await prisma.dietPlan.findFirst({
    where: { id: dietPlanId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Diet plan not found");
  }

  return prisma.$transaction(async (tx) => {
    await tx.dietPlan.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        description: payload.description,
        startDate: payload.startDate,
        endDate: payload.endDate,
      },
    });

    if (payload.meals) {
      await tx.dietPlanMeal.deleteMany({ where: { dietPlanId: existing.id } });

      for (let i = 0; i < payload.meals.length; i += 1) {
        const mealInput = payload.meals[i];
        const meal = await upsertMealForUser(tx, userId, mealInput);

        await tx.dietPlanMeal.create({
          data: {
            dietPlanId: existing.id,
            mealId: meal.id,
            mealOrder: mealInput.mealOrder ?? i,
            mealTime: mealInput.mealTime,
            notes: mealInput.planMealNotes,
          },
        });
      }
    }

    return tx.dietPlan.findUniqueOrThrow({
      where: { id: existing.id },
      include: {
        meals: {
          orderBy: { mealOrder: "asc" },
          include: { meal: true },
        },
      },
    });
  });
}

async function deleteDietPlanService(userId: string, dietPlanId: string) {
  const existing = await prisma.dietPlan.findFirst({
    where: { id: dietPlanId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Diet plan not found");
  }

  return prisma.dietPlan.delete({
    where: { id: existing.id },
    include: {
      meals: {
        orderBy: { mealOrder: "asc" },
        include: { meal: true },
      },
    },
  });
}

async function getMealsLibraryService(userId: string) {
  return prisma.meal.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });
}

export {
  createDietPlanService,
  getAllDietPlansService,
  getDietPlanByIdService,
  updateDietPlanService,
  deleteDietPlanService,
  getMealsLibraryService,
};
