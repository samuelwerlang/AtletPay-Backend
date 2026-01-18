import { prisma } from "../lib/prisma.js";

interface IuserData {
  auth0Id: string;
  email: string;
  name?: string;
}

async function createUserService(userCredentials: IuserData) {
  if (!userCredentials) {
    throw new Error("Could not reach user credentials");
  }

  const existingUser = await prisma.user.findUnique({
    where: { auth0Id: userCredentials.auth0Id },
  });

  if (existingUser) {
    return existingUser;
  }

  const createdUser = await prisma.user.create({ data: userCredentials });
  return createdUser;
}

export default createUserService;
