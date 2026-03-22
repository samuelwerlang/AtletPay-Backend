const mockPrisma = {
  charge: {
    findMany: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("@prisma/client", () => ({
  ChargeStatus: {
    PAID: "PAID",
    FAILED: "FAILED",
    PENDING: "PENDING",
  },
}));

import {
  createChargeService,
  markChargePaidService,
  markChargeFailedService,
  getStudentCharges,
  getPendingChargesService,
} from "../src/services/charges.services.js";

describe("charges.service", () => {
  const txMock = {
    charge: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a charge using the provided transaction", async () => {
    const createdCharge = { id: "charge-1" };
    txMock.charge.create.mockResolvedValue(createdCharge);

    const result = await createChargeService(txMock as any, {
      studentId: "student-1",
      amount: 8900,
      description: "Mensalidade",
      externalId: "pi_123",
      status: "PENDING" as any,
    });

    expect(result).toEqual(createdCharge);
    expect(txMock.charge.create).toHaveBeenCalledWith({
      data: {
        studentId: "student-1",
        amount: 8900,
        description: "Mensalidade",
        externalId: "pi_123",
        status: "PENDING",
        paidAt: undefined,
      },
    });
  });

  it("marks a charge as paid", async () => {
    txMock.charge.update.mockResolvedValue({ id: "charge-1" });

    await markChargePaidService(txMock as any, {
      chargeId: "charge-1",
      externalId: "pi_999",
      studentPlanId: "student-plan-1",
    });

    expect(txMock.charge.update).toHaveBeenCalledWith({
      where: { id: "charge-1" },
      data: {
        status: "PAID",
        paidAt: expect.any(Date),
        externalId: "pi_999",
        studentPlanId: "student-plan-1",
      },
    });
  });

  it("marks a charge as failed", async () => {
    txMock.charge.update.mockResolvedValue({ id: "charge-1" });

    await markChargeFailedService(txMock as any, "charge-1");

    expect(txMock.charge.update).toHaveBeenCalledWith({
      where: { id: "charge-1" },
      data: { status: "FAILED" },
    });
  });

  it("lists charges for a single student", async () => {
    const charges = [{ id: "charge-1" }];
    mockPrisma.charge.findMany.mockResolvedValue(charges);

    const result = await getStudentCharges("student-1");

    expect(result).toEqual(charges);
    expect(mockPrisma.charge.findMany).toHaveBeenCalledWith({
      where: { studentId: "student-1" },
    });
  });

  it("lists pending charges for many students", async () => {
    const charges = [{ id: "charge-1" }, { id: "charge-2" }];
    mockPrisma.charge.findMany.mockResolvedValue(charges);

    const result = await getPendingChargesService(["student-1", "student-2"]);

    expect(result).toEqual(charges);
    expect(mockPrisma.charge.findMany).toHaveBeenCalledWith({
      where: {
        studentId: { in: ["student-1", "student-2"] },
        status: "PENDING",
      },
    });
  });
});
