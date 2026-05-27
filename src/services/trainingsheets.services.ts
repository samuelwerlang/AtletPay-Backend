import { prisma } from "../lib/prisma.js";
import type { Prisma } from "@prisma/client";

interface ITrainingExerciseInput {
  exerciseId?: string;
  exerciseName?: string;
  sets: number;
  repetitions: string;
  notes?: string;
  order?: number;
}

interface ICreateTrainingSheetInput {
  name: string;
  startDate: Date;
  endDate?: Date;
  studentId: string;
  exercises: ITrainingExerciseInput[];
}

interface IUpdateTrainingSheetInput {
  name?: string;
  startDate?: Date;
  endDate?: Date;
  exercises?: ITrainingExerciseInput[];
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

async function resolveExerciseIdForUser(
  tx: Prisma.TransactionClient,
  userId: string,
  exerciseInput: ITrainingExerciseInput,
) {
  if (exerciseInput.exerciseId) {
    const existingExercise = await tx.exercise.findFirst({
      where: {
        id: exerciseInput.exerciseId,
        userId,
      },
      select: { id: true },
    });

    if (!existingExercise) {
      throw new Error("One or more exercises were not found");
    }

    return existingExercise.id;
  }

  const rawExerciseName = exerciseInput.exerciseName?.trim();
  if (!rawExerciseName) {
    throw new Error("Each item must provide exerciseId or exerciseName");
  }

  const exercise = await tx.exercise.upsert({
    where: {
      userId_name: {
        userId,
        name: rawExerciseName,
      },
    },
    update: {},
    create: {
      userId,
      name: rawExerciseName,
    },
    select: { id: true },
  });

  return exercise.id;
}

async function createTrainingSheetService(
  userId: string,
  payload: ICreateTrainingSheetInput,
) {
  await ensureStudentBelongsToUser(userId, payload.studentId);
  return prisma.$transaction(async (tx) => {
    const preparedExercises = await Promise.all(
      payload.exercises.map(async (exercise, index) => ({
        exerciseId: await resolveExerciseIdForUser(tx, userId, exercise),
        sets: exercise.sets,
        repetitions: exercise.repetitions,
        notes: exercise.notes,
        order: exercise.order ?? index,
      })),
    );

    return tx.trainingSheet.create({
      data: {
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        userId,
        studentId: payload.studentId,
        exercises: {
          create: preparedExercises,
        },
      },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true },
        },
      },
    });
  });
}

async function getAllTrainingSheetsService(userId: string, studentId?: string) {
  if (studentId) {
    await ensureStudentBelongsToUser(userId, studentId);
  }

  return prisma.trainingSheet.findMany({
    where: {
      userId,
      ...(studentId ? { studentId } : {}),
    },
    orderBy: [{ startDate: "desc" }, { createdAt: "desc" }],
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });
}

async function getTrainingSheetByIdService(
  userId: string,
  trainingSheetId: string,
  studentId?: string,
) {
  const trainingSheet = await prisma.trainingSheet.findFirst({
    where: {
      id: trainingSheetId,
      userId,
      ...(studentId ? { studentId } : {}),
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });

  if (!trainingSheet) {
    throw new Error("Training sheet not found");
  }

  return trainingSheet;
}

async function updateTrainingSheetService(
  userId: string,
  trainingSheetId: string,
  payload: IUpdateTrainingSheetInput,
) {
  const existing = await prisma.trainingSheet.findFirst({
    where: { id: trainingSheetId, userId },
    select: { id: true, studentId: true },
  });

  if (!existing) {
    throw new Error("Training sheet not found");
  }

  return prisma.$transaction(async (tx) => {
    const preparedExercises = payload.exercises
      ? await Promise.all(
          payload.exercises.map(async (exercise, index) => ({
            exerciseId: await resolveExerciseIdForUser(tx, userId, exercise),
            sets: exercise.sets,
            repetitions: exercise.repetitions,
            notes: exercise.notes,
            order: exercise.order ?? index,
          })),
        )
      : undefined;

    if (payload.exercises) {
      await tx.trainingSheetExercise.deleteMany({
        where: { trainingSheetId },
      });
    }

    const updated = await tx.trainingSheet.update({
      where: { id: existing.id },
      data: {
        name: payload.name,
        startDate: payload.startDate,
        endDate: payload.endDate,
        exercises: preparedExercises
          ? {
              create: preparedExercises,
            }
          : undefined,
      },
      include: {
        exercises: {
          orderBy: { order: "asc" },
          include: { exercise: true },
        },
      },
    });

    return updated;
  });
}

async function deleteTrainingSheetService(
  userId: string,
  trainingSheetId: string,
) {
  const existing = await prisma.trainingSheet.findFirst({
    where: { id: trainingSheetId, userId },
    select: { id: true },
  });

  if (!existing) {
    throw new Error("Training sheet not found");
  }

  return prisma.trainingSheet.delete({
    where: { id: existing.id },
    include: {
      exercises: {
        orderBy: { order: "asc" },
        include: { exercise: true },
      },
    },
  });
}

export {
  createTrainingSheetService,
  getAllTrainingSheetsService,
  getTrainingSheetByIdService,
  updateTrainingSheetService,
  deleteTrainingSheetService,
};
