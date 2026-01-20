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
  const parseResult = studentSchema.safeParse(req.body);

  if (!parseResult.success) {
    return res.status(400).json({
      error: "Invalid request body",
      issues: parseResult.error.issues,
    });
  }

  const userAuth0Id = req.auth?.payload.sub;
  const user = await prisma.user.findUnique({
    where: { id: userAuth0Id },
  });

  if (!user) {
    return res.status(404).json({ message: "User not found" });
  }

  try {
    const student = await createStudentService({
      userId: user.id,
      ...parseResult.data,
    });

    return res.status(201).json(student);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create student" });
  }
}

export default createStudentController;
