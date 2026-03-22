import * as z from "zod";
import { Request, Response } from "express";
import {
  createExerciseService,
  deleteExerciseService,
  getAllExercisesService,
  getExerciseByIdService,
  updateExerciseService,
} from "../services/exercises.services.js";

const createExerciseSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
});

const updateExerciseSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  })
  .refine(
    (value) => value.name !== undefined || value.description !== undefined,
    { message: "At least one field must be sent" },
  );

const idSchema = z.object({
  exerciseId: z.uuid(),
});

async function createExerciseController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const parsed = createExerciseSchema.parse(req.body);
  const created = await createExerciseService(user.id, parsed);

  return res.status(201).json(created);
}

async function getAllExercisesController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const data = await getAllExercisesService(user.id);

  return res.status(200).json(data);
}

async function getExerciseByIdController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { exerciseId } = idSchema.parse(req.params);
  const data = await getExerciseByIdService(user.id, exerciseId);

  return res.status(200).json(data);
}

async function updateExerciseController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { exerciseId } = idSchema.parse(req.params);
  const parsed = updateExerciseSchema.parse(req.body);

  const updated = await updateExerciseService(user.id, exerciseId, parsed);

  return res.status(200).json(updated);
}

async function deleteExerciseController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { exerciseId } = idSchema.parse(req.params);
  const deleted = await deleteExerciseService(user.id, exerciseId);

  return res.status(200).json(deleted);
}

export {
  createExerciseController,
  getAllExercisesController,
  getExerciseByIdController,
  updateExerciseController,
  deleteExerciseController,
};
