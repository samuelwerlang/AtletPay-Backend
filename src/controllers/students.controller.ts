import * as z from "zod";
import { prisma } from "../lib/prisma.js";
import { Request, Response } from "express";
import {
  createStudentService,
  deleteStudentService,
  getStudentByIdService,
  getAllStudentsService,
  updateStudentService,
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
  const auth0Id = req.auth!.payload.sub;
  const saasPlan = res.locals.saasPlan;

  const userId =
    res.locals.user?.id ??
    (await prisma.user.findUniqueOrThrow({
      where: { auth0Id },
      select: { id: true },
    }));

  try {
    const student = await createStudentService(
      {
        userId,
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

  const auth0Id = req.auth!.payload.sub;

  const userId =
    res.locals.user?.id ??
    (await prisma.user.findUniqueOrThrow({
      where: { auth0Id },
      select: { id: true },
    }));

  const deletedStudent = await deleteStudentService(userId, studentId);

  return res.status(200).json(deletedStudent);
}

async function updateStudentController(req: Request, res: Response) {
  const parsedResult = studentSchema.parse(req.body);
  const { studentId } = idStudentSchema.parse(req.params);
  const auth0Id = req.auth!.payload.sub;
  const userId =
    res.locals.user?.id ??
    (await prisma.user.findUniqueOrThrow({
      where: { auth0Id },
      select: { id: true },
    }));
  const updatedStudent = await updateStudentService(
    userId,
    studentId,
    parsedResult,
  );

  return res.status(200).json(updatedStudent);
}

async function getAllStudentsController(req: Request, res: Response) {
  const auth0Id = req.auth!.payload.sub;
  const userId =
    res.locals.user?.id ??
    (await prisma.user.findUniqueOrThrow({
      where: { auth0Id },
      select: { id: true },
    }));
  const students = await getAllStudentsService(userId);
  return res.status(200).json(students);
}

async function getStudentByIdController(req: Request, res: Response) {
  const { studentId } = idStudentSchema.parse(req.params);
  const auth0Id = req.auth!.payload.sub;
  const userId =
    res.locals.user?.id ??
    (await prisma.user.findUniqueOrThrow({
      where: { auth0Id },
      select: { id: true },
    }));
  const student = await getStudentByIdService(userId, studentId);
  return res.status(200).json(student);
}

export {
  createStudentController,
  getStudentByIdController,
  getAllStudentsController,
  deleteStudentController,
  updateStudentController,
};
