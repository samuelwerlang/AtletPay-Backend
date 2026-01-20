import { prisma } from "../lib/prisma.js";

interface IUserData {
  auth0Id: string;
  email: string;
  name?: string;
}

async function getOrCreateUserService(userCredentials: IUserData) {
  return prisma.user.upsert({
    where: { auth0Id: userCredentials.auth0Id },
    update: {
      email: userCredentials.email,
      name: userCredentials.name,
    },
    create: {
      auth0Id: userCredentials.auth0Id,
      email: userCredentials.email,
      name: userCredentials.name,
    },
    select: {
      id: true,
      email: true,
      name: true,
    },
  });
}

async function getUserService(auth0Id: string) {
  if (!auth0Id) {
    throw new Error("Auth0 ID is required");
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id },
    select: { id: true, email: true, name: true },
  });
  return user;
}

async function updateUserService(userCredentials: IUserData) {
  const auth0Id = userCredentials?.auth0Id;

  if (!auth0Id) {
    throw new Error("Auth0 ID is required to update user");
  }

  return prisma.user.update({
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
}

async function deleteUserService(userCredentials: IUserData) {
  const auth0Id = userCredentials?.auth0Id;

  if (!auth0Id) {
    throw new Error("Auth0 ID is required to delete user");
  }

  return prisma.user.delete({
    where: { auth0Id },
    select: {
      email: true,
      name: true,
    },
  });
}

export {
  getOrCreateUserService,
  getUserService,
  updateUserService,
  deleteUserService,
};
