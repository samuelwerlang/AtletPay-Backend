import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

async function checkStudentLimit(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const { maxStudents } = res.locals.saasPlan;

  if (!maxStudents) return next();

  const userStudentsCount = await prisma.student.count({
    where: {
      userId: res.locals.user.id,
    },
  });

  if (userStudentsCount >= maxStudents) {
    return res.status(403).json({
      message: "Students limit reached",
    });
  }

  return next();
}
