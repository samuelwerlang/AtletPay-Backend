import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import {
  createUserPlanService,
  getUserPlanService,
  getAllUserPlansService,
  updateUserPlanService,
  deleteUserPlanService,
} from "../services/userplans.services.js";

const userPlanSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  description: z.string().min(1),
  durationInWeeks: z.number().int().positive(),
  sessionsPerWeek: z.number().int().positive(),
});

const idPlanSchema = z.object({
  id: z.string().uuid(),
});

async function createUserPlanController(req: Request, res: Response) {
  const parsedResult = userPlanSchema.parse(req.body);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const plan = await createUserPlanService(parsedResult, user.id);

  return res.status(201).json(plan);
}

async function getUserPlanController(req: Request, res: Response) {
  const { id } = idPlanSchema.parse(req.params);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const plan = await getUserPlanService(id, user.id);

  return res.status(200).json(plan);
}

async function getAllUserPlansController(req: Request, res: Response) {
  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const plans = await getAllUserPlansService(user.id);

  return res.status(200).json(plans);
}

async function updateUserPlanController(req: Request, res: Response) {
  const parsedResult = userPlanSchema.parse(req.body);
  const { id } = idPlanSchema.parse(req.params);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const updatedPlan = await updateUserPlanService(parsedResult, user.id, id);

  return res.status(200).json(updatedPlan);
}

async function deleteUserPlanController(req: Request, res: Response) {
  const { id } = idPlanSchema.parse(req.params);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

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
