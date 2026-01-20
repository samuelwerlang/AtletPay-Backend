import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import { createStudentService } from "../services/students.services.js";

const studentSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(9),
  email: z.email(),
});

async function createStudentController(req: Request, res: Response) {
  const parsedResult = studentSchema.parse(req.body);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const student = await createStudentService({
    userId: user.id,
    ...parsedResult,
  });

  return res.status(201).json(student);
}

export default createStudentController;
