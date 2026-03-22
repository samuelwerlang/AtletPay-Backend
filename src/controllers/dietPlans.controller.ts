import * as z from "zod";
import { Request, Response } from "express";
import {
  createDietPlanService,
  deleteDietPlanService,
  getAllDietPlansService,
  getDietPlanByIdService,
  getMealsLibraryService,
  updateDietPlanService,
} from "../services/dietPlans.services.js";

const mealInputSchema = z.object({
  id: z.uuid().optional(),
  name: z.string().min(1),
  quantity: z.string().optional(),
  kcal: z.number().int().positive().optional(),
  substitutes: z.string().optional(),
  notes: z.string().optional(),
  mealTime: z.string().optional(),
  mealOrder: z.number().int().nonnegative().optional(),
  planMealNotes: z.string().optional(),
});

const createDietPlanSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime().optional(),
  studentId: z.uuid(),
  meals: z.array(mealInputSchema).min(1),
});

const updateDietPlanSchema = z
  .object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
    startDate: z.iso.datetime().optional(),
    endDate: z.iso.datetime().nullable().optional(),
    meals: z.array(mealInputSchema).min(1).optional(),
  })
  .refine(
    (value) =>
      value.name !== undefined ||
      value.description !== undefined ||
      value.startDate !== undefined ||
      value.endDate !== undefined ||
      value.meals !== undefined,
    { message: "At least one field must be sent" },
  );

const idSchema = z.object({
  dietPlanId: z.uuid(),
});

const getAllQuerySchema = z.object({
  studentId: z.uuid().optional(),
});

async function createDietPlanController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const parsed = createDietPlanSchema.parse(req.body);

  const created = await createDietPlanService(user.id, {
    ...parsed,
    startDate: new Date(parsed.startDate),
    endDate: parsed.endDate ? new Date(parsed.endDate) : undefined,
  });

  return res.status(201).json(created);
}

async function getAllDietPlansController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const query = getAllQuerySchema.parse(req.query);
  const studentContext = res.locals.studentContext as
    | { studentId: string; coachUserId: string }
    | undefined;

  const effectiveUserId = studentContext?.coachUserId ?? user.id;
  const effectiveStudentId = studentContext?.studentId ?? query.studentId;
  const data = await getAllDietPlansService(
    effectiveUserId,
    effectiveStudentId,
  );

  return res.status(200).json(data);
}

async function getDietPlanByIdController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { dietPlanId } = idSchema.parse(req.params);
  const studentContext = res.locals.studentContext as
    | { studentId: string; coachUserId: string }
    | undefined;

  const effectiveUserId = studentContext?.coachUserId ?? user.id;
  const effectiveStudentId = studentContext?.studentId;
  const data = await getDietPlanByIdService(
    effectiveUserId,
    dietPlanId,
    effectiveStudentId,
  );

  return res.status(200).json(data);
}

async function updateDietPlanController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { dietPlanId } = idSchema.parse(req.params);
  const parsed = updateDietPlanSchema.parse(req.body);

  const updated = await updateDietPlanService(user.id, dietPlanId, {
    name: parsed.name,
    description: parsed.description,
    startDate: parsed.startDate ? new Date(parsed.startDate) : undefined,
    endDate:
      parsed.endDate === null
        ? undefined
        : parsed.endDate
          ? new Date(parsed.endDate)
          : undefined,
    meals: parsed.meals,
  });

  return res.status(200).json(updated);
}

async function deleteDietPlanController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const { dietPlanId } = idSchema.parse(req.params);
  const deleted = await deleteDietPlanService(user.id, dietPlanId);

  return res.status(200).json(deleted);
}

async function getMealsLibraryController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const studentContext = res.locals.studentContext as
    | { studentId: string; coachUserId: string }
    | undefined;

  const effectiveUserId = studentContext?.coachUserId ?? user.id;
  const meals = await getMealsLibraryService(effectiveUserId);

  return res.status(200).json(meals);
}

export {
  createDietPlanController,
  getAllDietPlansController,
  getDietPlanByIdController,
  updateDietPlanController,
  deleteDietPlanController,
  getMealsLibraryController,
};
