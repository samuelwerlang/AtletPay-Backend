import { prisma } from "../lib/prisma.js";

interface IStudent {
  personalId: string;
  name: string;
  phone?: string;
  email?: string;
}

async function createStudentService(studentInfo: IStudent) {
  if (!studentInfo.personalId || !studentInfo.name) {
    throw new Error("Missing required student data");
  }

  // Verifica aluno duplicado para o MESMO personal
  if (studentInfo.email) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        personalId: studentInfo.personalId,
        email: studentInfo.email,
      },
    });

    if (existingStudent) {
      return existingStudent;
    }
  }

  const createdStudent = await prisma.student.create({
    data: studentInfo,
  });

  return createdStudent;
}

export default createStudentService;
