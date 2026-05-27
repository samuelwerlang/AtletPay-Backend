import { Request, Response, NextFunction } from "express";
import pkg from "@prisma/client";
const { UserRole } = pkg;
import { prisma } from "../lib/prisma.js";

async function checkStudentReadOnly(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const currentUser = res.locals.user;

  if (!currentUser?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  if (currentUser.role !== UserRole.STUDENT) {
    return next();
  }

  if (req.method !== "GET") {
    return res.status(403).json({
      message: "Students can only access read-only routes",
    });
  }

  const linkedStudent = await prisma.student.findFirst({
    where: { studentUserId: currentUser.id },
    select: { id: true, userId: true, isActive: true },
  });

  if (!linkedStudent) {
    return res.status(403).json({
      message: "Student account is not linked",
    });
  }

  if (!linkedStudent.isActive) {
    return res.status(403).json({
      message: "Student account is inactive",
    });
  }

  res.locals.studentContext = {
    studentId: linkedStudent.id,
    coachUserId: linkedStudent.userId,
  };

  return next();
}

export default checkStudentReadOnly;
