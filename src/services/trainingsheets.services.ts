import { prisma } from "../lib/prisma.js";

interface ITrainingExerciseInput {
  exerciseName: string;
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

async function createTrainingSheetService(
  userId: string,
  payload: ICreateTrainingSheetInput,
) {
  await ensureStudentBelongsToUser(userId, payload.studentId);

  return prisma.trainingSheet.create({
    data: {
      name: payload.name,
      startDate: payload.startDate,
      endDate: payload.endDate,
      userId,
      studentId: payload.studentId,
      exercises: {
        create: payload.exercises.map((exercise, index) => ({
          exerciseName: exercise.exerciseName,
          sets: exercise.sets,
          repetitions: exercise.repetitions,
          notes: exercise.notes,
          order: exercise.order ?? index,
        })),
      },
    },
    include: {
      exercises: {
        orderBy: { order: "asc" },
      },
    },
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
      },
    },
  });
}

async function getTrainingSheetByIdService(
  userId: string,
  trainingSheetId: string,
) {
  const trainingSheet = await prisma.trainingSheet.findFirst({
    where: { id: trainingSheetId, userId },
    include: {
      exercises: {
        orderBy: { order: "asc" },
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
        exercises: payload.exercises
          ? {
              create: payload.exercises.map((exercise, index) => ({
                exerciseName: exercise.exerciseName,
                sets: exercise.sets,
                repetitions: exercise.repetitions,
                notes: exercise.notes,
                order: exercise.order ?? index,
              })),
            }
          : undefined,
      },
      include: {
        exercises: {
          orderBy: { order: "asc" },
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
