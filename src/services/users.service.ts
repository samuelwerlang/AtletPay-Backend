import { prisma } from "../lib/prisma.js";

export interface IUserData {
  sub: string;
  email: string;
  name?: string;
  stripeCustomerId?: string;
  stripeAccountId?: string;
}

async function createUserService(userCredentials: IUserData) {
  return prisma.user.upsert({
    where: { auth0Id: userCredentials.sub },
    update: {
      email: userCredentials.email,
      name: userCredentials.name,
    },
    create: {
      auth0Id: userCredentials.sub,
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
    where: { auth0Id: auth0Id },
    select: { id: true, email: true, name: true },
  });
  return user;
}

async function updateUserService(userCredentials: IUserData) {
  const auth0Id = userCredentials.sub;

  if (!auth0Id) {
    throw new Error("[UPDATE-USER-SERVICE]Auth0 ID is required to update user");
  }

  return prisma.user.update({
    where: { auth0Id },
    data: {
      auth0Id: userCredentials.sub,
      email: userCredentials.email,
      name: userCredentials.name,
      stripeAccountId: userCredentials.stripeAccountId,
    },
    select: {
      email: true,
      name: true,
    },
  });
}

async function deleteUserService(userCredentials: Pick<IUserData, "sub">) {
  const auth0Id = userCredentials?.sub;

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
  createUserService,
  getUserService,
  updateUserService,
  deleteUserService,
};
