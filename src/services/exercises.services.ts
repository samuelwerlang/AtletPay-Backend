import { prisma } from "../lib/prisma.js";

interface ICreateExerciseInput {
  name: string;
  description?: string;
}

interface IUpdateExerciseInput {
  name?: string;
  description?: string;
}

async function createExerciseService(
  userId: string,
  payload: ICreateExerciseInput,
) {
  return prisma.exercise.create({
    data: {
      name: payload.name,
      description: payload.description,
      userId,
    },
  });
}

async function getAllExercisesService(userId: string) {
  return prisma.exercise.findMany({
    where: { userId },
    orderBy: [{ updatedAt: "desc" }, { name: "asc" }],
  });
}

async function getExerciseByIdService(userId: string, exerciseId: string) {
  const exercise = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
  });

  if (!exercise) {
    throw new Error("Exercise not found");
  }

  return exercise;
}

async function updateExerciseService(
  userId: string,
  exerciseId: string,
  payload: IUpdateExerciseInput,
) {
  const existing = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Exercise not found");
  }

  return prisma.exercise.update({
    where: { id: existing.id },
    data: {
      name: payload.name,
      description: payload.description,
    },
  });
}

async function deleteExerciseService(userId: string, exerciseId: string) {
  const existing = await prisma.exercise.findFirst({
    where: { id: exerciseId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Exercise not found");
  }

  return prisma.exercise.delete({
    where: { id: existing.id },
  });
}

export {
  createExerciseService,
  getAllExercisesService,
  getExerciseByIdService,
  updateExerciseService,
  deleteExerciseService,
};
