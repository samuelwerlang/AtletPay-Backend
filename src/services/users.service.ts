import { prisma } from "../lib/prisma.js";
import { UserRole } from "@prisma/client";

export interface IUserData {
  sub: string;
  email: string;
  name?: string;
  role?: UserRole;
  stripeCustomerId?: string;
  stripeAccountId?: string;
}

async function createUserService(userCredentials: IUserData) {
  const normalizedEmail = userCredentials.email.trim().toLowerCase();
  const requestedRole = userCredentials.role ?? UserRole.USER;

  return prisma.$transaction(async (tx) => {
    const user = await tx.user.upsert({
      where: { auth0Id: userCredentials.sub },
      update: {
        email: normalizedEmail,
        name: userCredentials.name,
        role: requestedRole,
      },
      create: {
        auth0Id: userCredentials.sub,
        email: normalizedEmail,
        name: userCredentials.name,
        role: requestedRole,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    // Auto-link student account only when there is exactly one unambiguous match by email.
    const matchingStudents = await tx.student.findMany({
      where: { email: { equals: normalizedEmail, mode: "insensitive" } },
      select: { id: true, studentUserId: true },
    });

    if (matchingStudents.length === 1) {
      const [student] = matchingStudents;
      if (student.studentUserId !== user.id) {
        await tx.student.update({
          where: { id: student.id },
          data: { studentUserId: user.id },
        });
      }

      await tx.user.update({
        where: { id: user.id },
        data: { role: UserRole.STUDENT },
      });
    }

    return user;
  });
}

async function getUserService(auth0Id: string) {
  if (!auth0Id) {
    throw new Error("Auth0 ID is required");
  }

  const user = await prisma.user.findUnique({
    where: { auth0Id: auth0Id },
    select: { id: true, email: true, name: true, role: true },
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
      role: true,
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
