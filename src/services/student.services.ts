import { prisma } from "../lib/prisma.js";

interface IStudent {
  userAuth0Id: string;
  name: string;
  phone?: string;
  email?: string;
}

async function createStudentService(studentInfo: IStudent) {

  if (!studentInfo.userAuth0Id || !studentInfo.name) {
    throw new Error("Missing required student data");
  }

  const user = await prisma.user.findUnique({
    where: {
      auth0Id: studentInfo.userAuth0Id
    }
  });

  if(!user) {
    throw new Error("Could not find user (personal)")
  }

  // Verify duplicated students for the same user
  if(studentInfo.email) {
    const existingStudent = await prisma.student.findFirst({
      where: {
        userId: studentInfo.userAuth0Id,
        email: studentInfo.email,
      },
    });

    if (existingStudent) {
      return existingStudent;
    }
  }

  const createdStudent = await prisma.student.create({
    data: {
      name: studentInfo.name,
      email: studentInfo.email,
      phone: studentInfo.phone,
      userId: user.id,
    },
  });

  return createdStudent;
}

export default createStudentService;
