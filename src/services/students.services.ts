import { StudentPlanStatus } from "@prisma/client";
import { prisma } from "../lib/prisma.js";

interface IStudent {
  userId: string;
  name: string;
  phone?: string;
  email?: string;
}

type saasPlan = { maxStudents?: number };

async function createStudentService(data: IStudent, saasPlan?: saasPlan) {
  // Defesa em profundidade: checagem do limite dentro de uma transação
  if (saasPlan?.maxStudents) {
    return prisma.$transaction(async (tx) => {
      const count = await tx.student.count({ where: { userId: data.userId } });
      if (count >= saasPlan.maxStudents!) {
        const err: any = new Error("Students limit reached");
        err.code = "MAX_STUDENTS_REACHED";
        throw err;
      }

      const student = await tx.student.create({
        data: {
          ...data,
        },
      });

      return student;
    });
  }

  // Se não há limite, cria direto
  return prisma.student.create({
    data: {
      ...data,
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

export async function getActiveStudentsService(userId: string) {
  const now = new Date();
  return prisma.student.findMany({
    where: {
      userId,
      studentPlans: {
        some: {
          status: StudentPlanStatus.ACTIVE,
          endDate: { gt: now },
        },
      },
    },
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      // opcional: retornar info do plano ativo para mostrar validade
      studentPlans: {
        where: { status: StudentPlanStatus.ACTIVE, endDate: { gt: now } },
        select: { id: true, startDate: true, endDate: true, status: true },
      },
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
