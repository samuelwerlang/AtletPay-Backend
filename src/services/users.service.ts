import { prisma } from "../lib/prisma.js";

interface IUserData {
  auth0Id: string;
  email: string;
  name?: string;
}

async function createUserService(userCredentials: IUserData) {
  if (!userCredentials?.auth0Id) {
    throw new Error("Auth0 ID is required");
  }

  try {
    const createdUser = await prisma.user.create({
      data: userCredentials,
    });
    return createdUser;
  } catch (error: any) {
    if (error.code === "P2002") {
      // P2002 = unique constraint violation (já existe)
      const existingUser = await prisma.user.findUnique({
        where: { auth0Id: userCredentials.auth0Id },
      });
      if (!existingUser) throw error; // fallback, raro
      return existingUser;
    }
    throw new Error(`Failed to create user: ${error.message}`);
  }
}

async function getUserService(auth0Id: string) {
  if (!auth0Id) throw new Error("Auth0 ID is required");

  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { id: true, email: true, name: true },
  });

  if (!user) throw new Error("User not found");

  return user;
}

async function updateUserService(userCredentials: IUserData) {
  const auth0Id = userCredentials?.auth0Id;
  if (!auth0Id) {
    throw new Error("Auth0 ID is required to update user");
  }

  try {
    const updatedUser = await prisma.user.update({
      where: { auth0Id },
      data: {
        email: userCredentials.email,
        name: userCredentials.name,
      },
      select: {
        email: true,
        name: true,
      },
    });

    return updatedUser;
  } catch (error: any) {
    if (error.code === "P2025") {
      throw new Error("User does not exist");
    }
    throw new Error(`Failed to update user: ${error.message}`);
  }
}

async function deleteUserService(userCredentials: IUserData) {
  const auth0Id = userCredentials?.auth0Id;
  if (!auth0Id) {
    throw new Error("Auth0 ID is required to delete user");
  }

  try {
    const deletedUser = await prisma.user.delete({
      where: { auth0Id }, // prisma permite deletar direto pelo campo único
      select: {
        email: true,
        name: true,
      },
    });

    return deletedUser;
  } catch (error: any) {
    if (error.code === "P2025") {
      // P2025 = record not found
      throw new Error("User does not exist");
    }
    throw new Error(`Failed to delete user: ${error.message}`);
  }
}

export {
  createUserService,
  getUserService,
  updateUserService,
  deleteUserService,
};
