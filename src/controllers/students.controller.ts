import * as z from "zod";
import { Request, Response } from "express";
import createStudentService from "../services/createStudents.services.js";

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

  if (!userAuth0Id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  try {
    const student = await createStudentService({
      userAuth0Id,
      ...parseResult.data,
    });

    return res.status(201).json(student);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Failed to create student" });
  }
}

export default createStudentController;
