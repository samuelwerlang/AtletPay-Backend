import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import {
  createUserPlanService,
  deleteUserPlanService,
  getUserPlanService,
  getAllUserPlansService,
  updateUserPlanService,
} from "../services/userplans.services.js";

const userPlanSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().min(1),
  durationInWeeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
});

const updateUserPlanSchema = userPlanSchema.partial();

const idPlanSchema = z.object({
  id: z.uuid(),
});

async function createUserPlanController(req: Request, res: Response) {
  const parsedResult = userPlanSchema.parse(req.body);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  if (!user?.stripeAccountId) {
    return res.status(401).json({ message: "Non-existing Stripe account" });
  }

  const plan = await createUserPlanService(
    parsedResult,
    user.id,
    user.stripeAccount,
  );

  return res.status(201).json(plan);
}

async function getUserPlanController(req: Request, res: Response) {
  const { id } = idPlanSchema.parse(req.params);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const plan = await getUserPlanService(id, user.id);

  return res.status(200).json(plan);
}

async function getAllUserPlansController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const plans = await getAllUserPlansService(user.id);

  return res.status(200).json(plans);
}

async function updateUserPlanController(req: Request, res: Response) {
  const parsedResult = updateUserPlanSchema.parse(req.body);
  const { id } = idPlanSchema.parse(req.params);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const updatedPlan = await updateUserPlanService(parsedResult, user.id, id);

  return res.status(200).json(updatedPlan);
}

async function deleteUserPlanController(req: Request, res: Response) {
  const { id } = idPlanSchema.parse(req.params);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const deletedPlan = await deleteUserPlanService(id, user.id);

  return res.status(200).json(deletedPlan);
}

export {
  createUserPlanController,
  getUserPlanController,
  getAllUserPlansController,
  updateUserPlanController,
  deleteUserPlanController,
};
