const mockPrisma = {
  $transaction: jest.fn(),
  user: {
    upsert: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
  student: {
    findMany: jest.fn(),
    update: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import {
  createUserService,
  deleteUserService,
  getUserService,
  updateUserService,
} from "../src/services/users.service.js";

describe("users.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockPrisma.$transaction.mockImplementation(async (callback: any) =>
      callback({
        user: mockPrisma.user,
        student: mockPrisma.student,
      }),
    );

    mockPrisma.student.findMany.mockResolvedValue([]);
  });

  it("creates or updates a user with the expected upsert payload", async () => {
    const user = {
      id: "user-1",
      email: "sam@example.com",
      name: "Sam",
      role: "USER",
    };
    mockPrisma.user.upsert.mockResolvedValue(user);

    const result = await createUserService({
      sub: "auth0|123",
      email: "sam@example.com",
      name: "Sam",
    });

    expect(result).toEqual(user);
    expect(mockPrisma.user.upsert).toHaveBeenCalledWith({
      where: { auth0Id: "auth0|123" },
      update: {
        email: "sam@example.com",
        name: "Sam",
        role: "USER",
      },
      create: {
        auth0Id: "auth0|123",
        email: "sam@example.com",
        name: "Sam",
        role: "USER",
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
      where: { email: { equals: "sam@example.com", mode: "insensitive" } },
      select: { id: true, studentUserId: true },
    });
  });

  it("rejects getUserService when auth0 id is missing", async () => {
    await expect(getUserService("")).rejects.toThrow("Auth0 ID is required");
    expect(mockPrisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("queries a user by auth0 id", async () => {
    const user = {
      id: "user-1",
      email: "sam@example.com",
      name: "Sam",
      role: "USER",
    };
    mockPrisma.user.findUnique.mockResolvedValue(user);

    const result = await getUserService("auth0|123");

    expect(result).toEqual(user);
    expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
      where: { auth0Id: "auth0|123" },
      select: { id: true, email: true, name: true, role: true },
    });
  });

  it("rejects updateUserService when auth0 id is missing", async () => {
    await expect(
      updateUserService({ sub: "", email: "sam@example.com" }),
    ).rejects.toThrow(
      "[UPDATE-USER-SERVICE]Auth0 ID is required to update user",
    );

    expect(mockPrisma.user.update).not.toHaveBeenCalled();
  });

  it("updates a user including stripe account id", async () => {
    const updatedUser = {
      email: "sam@example.com",
      name: "Sam",
      role: "USER",
    };
    mockPrisma.user.update.mockResolvedValue(updatedUser);

    const result = await updateUserService({
      sub: "auth0|123",
      email: "sam@example.com",
      name: "Sam",
      stripeAccountId: "acct_123",
    });

    expect(result).toEqual(updatedUser);
    expect(mockPrisma.user.update).toHaveBeenCalledWith({
      where: { auth0Id: "auth0|123" },
      data: {
        auth0Id: "auth0|123",
        email: "sam@example.com",
        name: "Sam",
        stripeAccountId: "acct_123",
      },
      select: {
        email: true,
        name: true,
        role: true,
      },
    });
  });

  it("deletes a user by auth0 id", async () => {
    const deletedUser = { email: "sam@example.com", name: "Sam" };
    mockPrisma.user.delete.mockResolvedValue(deletedUser);

    const result = await deleteUserService({ sub: "auth0|123" });

    expect(result).toEqual(deletedUser);
    expect(mockPrisma.user.delete).toHaveBeenCalledWith({
      where: { auth0Id: "auth0|123" },
      select: {
        email: true,
        name: true,
      },
    });
  });
});
