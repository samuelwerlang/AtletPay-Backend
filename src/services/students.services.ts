import { prisma } from "../lib/prisma.js";

interface IStudent {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
}

async function createStudentService(studentInfo: IStudent) {
  if (!studentInfo.userId) {
    throw new Error("Student must be linked to a user");
  }

  if (!studentInfo.name?.trim()) {
    throw new Error("Student name is required");
  }

  return prisma.student.create({
    data: {
      name: studentInfo.name,
      email: studentInfo.email,
      phone: studentInfo.phone,
      userId: studentInfo.userId,
    },
  });
}

async function getAllStudentsService(userId: string) {
  const students = await prisma.student.findMany({
    where: { userId },
    orderBy: { name: "desc" },
  });
  return students;
}

async function getStudentByIdService(userId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      userId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return student;
}

async function updateStudentService(
  userId: string,
  studentId: string,
  data: Pick<IStudent, "name" | "email" | "phone">,
) {
  const student = await prisma.student.findFirst({
    where: { id: studentId, userId },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return prisma.student.update({
    where: { id: student.id },
    data: {
      name: data.name,
      email: data.email,
      phone: data.phone,
    },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });
}

async function deleteStudentService(userId: string, studentId: string) {
  const student = await prisma.student.findFirst({
    where: {
      id: studentId,
      userId: userId,
    },
  });

  if (!student) {
    throw new Error("Student not found");
  }

  return prisma.student.delete({
    where: { id: student.id },
    select: {
      name: true,
      email: true,
      phone: true,
    },
  });
}

export {
  createStudentService,
  getStudentByIdService,
  getAllStudentsService,
  updateStudentService,
  deleteStudentService,
};
