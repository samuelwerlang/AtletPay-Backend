import * as z from "zod";
import { Request, Response } from "express";
import createStudentService from "../services/createStudents.services.js";

async function createStudentController(req: Request, res: Response) {
  const studentSchema = z.object({
    name: z.string().min(1),
    phone: z.string().min(9),
    email: z.string().max(254),
  });

  const validatedData = studentSchema.parse(req.body);

  const userAuth0Id: string = req.oidc.user?.sub;
  if (!req.oidc.user?.sub) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  if (!validatedData.name || !validatedData.email) {
    return res.status(400).json({ message: "Missing required fields" });
  }

  try {
    const student = await createStudentService({
      userAuth0Id: userAuth0Id,
      name: validatedData.name,
      phone: validatedData.phone,
      email: validatedData.email,
    });
    res.json(student);
  } catch (error) {
    res.status(500).send("Failed to create Student");
    console.error(error);
  }
}

export default createStudentController;
