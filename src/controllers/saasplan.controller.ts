import * as z from "zod";
import { Request, Response } from "express";
import createSaasPlanService from "../services/saasplan.services.js";
import { SaasPlanType } from "@prisma/client";

const createSaasPlanSchema = z.object({
  name: z.string().min(1),
  price: z.number().positive(),
  maxPlans: z.number().int().positive().optional(),
  maxStudents: z.number().int().positive().optional(),
  StripePriceId: z.string().min(1),
  type: z.enum(SaasPlanType),
});

async function createSaasPlanController(req: Request, res: Response) {
  const validatedData = createSaasPlanSchema.parse(req.body);
  const saasPlan = await createSaasPlanService({
    name: validatedData.name,
    price: validatedData.price,
    maxPlans: validatedData.maxPlans,
    maxStudents: validatedData.maxStudents,
    StripePriceId: validatedData.StripePriceId, //Mapping
    type: validatedData.type,
  });

  return res.status(201).json(saasPlan);
}

export default createSaasPlanController;
