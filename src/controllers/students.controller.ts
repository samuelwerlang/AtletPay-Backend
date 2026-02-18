import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import {
  createStudentService,
  deleteStudentService,
  getStudentByIdService,
  getAllStudentsService,
  updateStudentService,
  getActiveStudentsService,
} from "../services/students.services.js";

const studentSchema = z.object({
  name: z.string().min(1),
  phone: z.string().min(9).optional(),
  email: z.email().optional(),
});

const idStudentSchema = z.object({
  studentId: z.uuid(),
});

async function createStudentController(req: Request, res: Response) {
  const parsedResult = studentSchema.parse(req.body);
  const saasPlan = res.locals.saasPlan;

  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  try {
    const student = await createStudentService(
      {
        userId: user.id,
        name: parsedResult.name,
        phone: parsedResult.phone,
        email: parsedResult.email,
      },
      saasPlan,
    );

    return res.status(201).json(student);
  } catch (err: any) {
    if (err?.code === "MAX_STUDENTS_REACHED") {
      return res.status(403).json({ message: "Students limit reached" });
    }
  }
}

async function deleteStudentController(req: Request, res: Response) {
  const { studentId } = idStudentSchema.parse(req.params);

  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  const deletedStudent = await deleteStudentService(user.id, studentId);

  return res.status(200).json(deletedStudent);
}

async function updateStudentController(req: Request, res: Response) {
  const parsedResult = studentSchema.parse(req.body);
  const { studentId } = idStudentSchema.parse(req.params);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const updatedStudent = await updateStudentService(
    user.id,
    studentId,
    parsedResult,
  );

  return res.status(200).json(updatedStudent);
}

async function getAllStudentsController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const students = await getAllStudentsService(user.id);
  return res.status(200).json(students);
}

async function getStudentByIdController(req: Request, res: Response) {
  const { studentId } = idStudentSchema.parse(req.params);
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const student = await getStudentByIdService(user.id, studentId);
  return res.status(200).json(student);
}

export async function getActiveStudentsController(req: Request, res: Response) {
  const user = res.locals.user;
  if (!user?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }
  const students = await getActiveStudentsService(user.id);
  return res.status(200).json(students);
}

export {
  createStudentController,
  getStudentByIdController,
  getAllStudentsController,
  deleteStudentController,
  updateStudentController,
};
