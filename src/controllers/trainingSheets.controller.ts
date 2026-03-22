import * as z from "zod";
import { Request, Response } from "express";
import {
  createTrainingSheetService,
  deleteTrainingSheetService,
  getAllTrainingSheetsService,
  getTrainingSheetByIdService,
  updateTrainingSheetService,
} from "../services/trainingsheets.services.js";

const trainingExerciseSchema = z
  .object({
    exerciseId: z.uuid().optional(),
    exerciseName: z.string().min(1).optional(),
    sets: z.number().int().positive(),
    repetitions: z.string().min(1),
    notes: z.string().optional(),
    order: z.number().int().nonnegative().optional(),
  })
  .refine(
    (value) =>
      value.exerciseId !== undefined || value.exerciseName !== undefined,
    {
      message: "Each item must provide exerciseId or exerciseName",
    },
  );

const createTrainingSheetSchema = z.object({
  name: z.string().min(1),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
  studentId: z.uuid(),
  exercises: z.array(trainingExerciseSchema).min(1),
});

const updateTrainingSheetSchema = z
  .object({
    name: z.string().min(1).optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().nullable().optional(),
    exercises: z.array(trainingExerciseSchema).min(1).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.exercises !== undefined,
    { message: "At least one field must be sent" },
  );

const idSchema = z.object({
  trainingSheetId: z.uuid(),
});

const getAllQuerySchema = z.object({
  studentId: z.uuid().optional(),
});

async function createTrainingSheetController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const parsed = createTrainingSheetSchema.parse(req.body);

  const created = await createTrainingSheetService(user.id, {
    ...parsed,
    startDate: new Date(parsed.startDate),
    endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
  });

  return res.status(201).json(created);
}

async function getAllTrainingSheetsController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const query = getAllQuerySchema.parse(req.query);

  const data = await getAllTrainingSheetsService(user.id, query.studentId);

  return res.status(200).json(data);
}

async function getTrainingSheetByIdController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { trainingSheetId } = idSchema.parse(req.params);
  const data = await getTrainingSheetByIdService(user.id, trainingSheetId);

  return res.status(200).json(data);
}

async function updateTrainingSheetController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { trainingSheetId } = idSchema.parse(req.params);
  const parsed = updateTrainingSheetSchema.parse(req.body);

  const updated = await updateTrainingSheetService(user.id, trainingSheetId, {
    name: parsed.name,
    startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
    endDate:
      parsed.endDate === null
        ? undefined
        : parsed.endDate
          ? new Date(parsed.endDate)
          : undefined,
    exercises: parsed.exercises,
  });

  return res.status(200).json(updated);
}

async function deleteTrainingSheetController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { trainingSheetId } = idSchema.parse(req.params);
  const deleted = await deleteTrainingSheetService(user.id, trainingSheetId);

  return res.status(200).json(deleted);
}

export {
  createTrainingSheetController,
  getAllTrainingSheetsController,
  getTrainingSheetByIdController,
  updateTrainingSheetController,
  deleteTrainingSheetController,
};
