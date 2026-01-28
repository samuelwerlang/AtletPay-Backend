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

async function deleteStudentController(req: Request, res: Response) {
  const { studentId } = idStudentSchema.parse(req.params);

  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });

  const deletedStudent = await deleteStudentService(user.id, studentId);

  return res.status(200).json(deletedStudent);
}

async function updateStudentController(req: Request, res: Response) {
  const parsedResult = studentSchema.parse(req.body);
  const { studentId } = idStudentSchema.parse(req.params);
  const auth0Id = req.auth!.payload.sub;
  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });
  const updatedStudent = await updateStudentService(
    user.id,
    studentId,
    parsedResult,
  );
  return res.status(200).json(updatedStudent);
}

async function getAllStudentsController(req: Request, res: Response) {
  const auth0Id = req.auth!.payload.sub;
  const user = await prisma.user.findUnique({
    where: {
      auth0Id: auth0Id,
    },
  });
  const students = await getAllStudentsService(user!.id);
  return res.status(200).json(students);
}

async function getStudentByIdController(req: Request, res: Response) {
  const { studentId } = idStudentSchema.parse(req.params);
  const auth0Id = req.auth!.payload.sub;
  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
    select: { id: true },
  });
  const student = await getStudentByIdService(user.id, studentId);
  return res.status(200).json(student);
}

export {
  createStudentController,
  getStudentByIdController,
  getAllStudentsController,
  deleteStudentController,
  updateStudentController,
};
