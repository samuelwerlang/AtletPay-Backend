const txMock = {
  student: {
    count: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
  },
  studentPlan: {
    count: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn(),
  student: {
    create: jest.fn(),
    findMany: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("@prisma/client", () => ({
  StudentPlanStatus: {
    ACTIVE: "ACTIVE",
    SUCCEEDED: "SUCCEEDED",
  },
}));

import {
  createStudentService,
  getAllStudentsService,
  getStudentByIdService,
  updateStudentService,
  deleteStudentService,
  recomputeStudentActiveFlag,
  getActiveStudentsService,
} from "../src/services/students.services.js";

describe("students.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) =>
      callback(txMock),
    );
  });

  it("creates student directly when there is no saas limit", async () => {
    const created = { id: "student-1" };
    mockPrisma.student.create.mockResolvedValue(created);

    const result = await createStudentService({
      userId: "user-1",
      name: "Rafael",
      email: "rafael@example.com",
      phone: "5511999999999",
    });

    expect(result).toEqual(created);
    expect(mockPrisma.student.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        name: "Rafael",
        email: "rafael@example.com",
        phone: "5511999999999",
      },
    });
  });

  it("creates student inside transaction when saas limit is configured", async () => {
    const created = { id: "student-1" };
    txMock.student.count.mockResolvedValue(1);
    txMock.student.create.mockResolvedValue(created);

    const result = await createStudentService(
      { userId: "user-1", name: "Rafael" },
      { maxStudents: 2 },
    );

    expect(result).toEqual(created);
    expect(txMock.student.count).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
    expect(txMock.student.create).toHaveBeenCalledWith({
      data: { userId: "user-1", name: "Rafael" },
    });
  });

  it("throws MAX_STUDENTS_REACHED when limit is exceeded", async () => {
    txMock.student.count.mockResolvedValue(2);

    await expect(
      createStudentService(
        { userId: "user-1", name: "Rafael" },
        { maxStudents: 2 },
      ),
    ).rejects.toMatchObject({
      message: "Students limit reached",
      code: "MAX_STUDENTS_REACHED",
    });

    expect(txMock.student.create).not.toHaveBeenCalled();
  });

  it("gets all students for one user ordered by name desc", async () => {
    const students = [{ id: "student-1" }];
    mockPrisma.student.findMany.mockResolvedValue(students);

    const result = await getAllStudentsService("user-1");

    expect(result).toEqual(students);
    expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { name: "desc" },
    });
  });

  it("throws when student is not found by id", async () => {
    mockPrisma.student.findFirst.mockResolvedValue(null);

    await expect(
      getStudentByIdService("user-1", "student-404"),
    ).rejects.toThrow("Student not found");
  });

  it("updates student when it exists", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });
    mockPrisma.student.update.mockResolvedValue({ name: "Novo Nome" });

    const result = await updateStudentService("user-1", "student-1", {
      name: "Novo Nome",
      email: "novo@example.com",
      phone: "5511999888777",
    });

    expect(result).toEqual({ name: "Novo Nome" });
    expect(mockPrisma.student.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: {
        name: "Novo Nome",
        email: "novo@example.com",
        phone: "5511999888777",
      },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });
  });

  it("deletes student when it exists", async () => {
    mockPrisma.student.findFirst.mockResolvedValue({ id: "student-1" });
    mockPrisma.student.delete.mockResolvedValue({ id: "student-1" });

    const result = await deleteStudentService("user-1", "student-1");

    expect(result).toEqual({ id: "student-1" });
    expect(mockPrisma.student.delete).toHaveBeenCalledWith({
      where: { id: "student-1" },
      select: {
        name: true,
        email: true,
        phone: true,
      },
    });
  });

  it("recomputes student active flag based on valid plans", async () => {
    txMock.studentPlan.count.mockResolvedValue(1);

    await recomputeStudentActiveFlag(txMock as any, "student-1");

    expect(txMock.studentPlan.count).toHaveBeenCalledWith({
      where: {
        studentId: "student-1",
        OR: [{ status: "ACTIVE" }, { status: "SUCCEEDED" }],
        endDate: { gt: expect.any(Date) },
      },
    });
    expect(txMock.student.update).toHaveBeenCalledWith({
      where: { id: "student-1" },
      data: { isActive: true },
    });
  });

  it("gets active students with active plan details", async () => {
    mockPrisma.student.findMany.mockResolvedValue([{ id: "student-1" }]);

    await getActiveStudentsService("user-1");

    expect(mockPrisma.student.findMany).toHaveBeenCalledWith({
      where: {
        userId: "user-1",
        studentPlans: {
          some: {
            status: "ACTIVE",
            endDate: { gt: expect.any(Date) },
          },
        },
      },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        studentPlans: {
          where: { status: "ACTIVE", endDate: { gt: expect.any(Date) } },
          select: { id: true, startDate: true, endDate: true, status: true },
        },
      },
    });
  });
});
