const recomputeStudentActiveFlagMock = jest.fn();
const fetchStudentBasedOnUserIdMock = jest.fn();
const fetchUserPlanBasedOnUserIdMock = jest.fn();
const calculateSubscriptionStudentPlanDatesMock = jest.fn();
const calculatePaymentIntentStudentPlanEndDateMock = jest.fn();
const mapStripeStudentPlanStatusToPrismaMock = jest.fn();

jest.mock("../src/services/students.services.js", () => ({
  recomputeStudentActiveFlag: recomputeStudentActiveFlagMock,
}));

jest.mock("../src/utils/studentPlanServiceHandlers.js", () => ({
  fetchStudentBasedOnUserId: fetchStudentBasedOnUserIdMock,
  fetchUserPlanBasedOnUserId: fetchUserPlanBasedOnUserIdMock,
  calculateSubscriptionStudentPlanDates:
    calculateSubscriptionStudentPlanDatesMock,
  calculatePaymentIntentStudentPlanEndDate:
    calculatePaymentIntentStudentPlanEndDateMock,
  checkActiveStudentPlan: jest.fn(),
  mapStripeStudentPlanStatusToPrisma: mapStripeStudentPlanStatusToPrismaMock,
}));

jest.mock("@prisma/client", () => ({
  StudentPlanStatus: {
    ACTIVE: "ACTIVE",
    CANCELED: "CANCELED",
  },
}));

import {
  upsertStudentPlanBasedOnSubscriptionService,
  upsertStudentPlanBasedOnPaymentIntentService,
  cancelStudentPlanService,
} from "../src/services/studentplans.services.js";

describe("studentplans.service", () => {
  const txMock = {
    studentPlan: {
      upsert: jest.fn(),
      findFirstOrThrow: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    fetchUserPlanBasedOnUserIdMock.mockResolvedValue({
      id: "plan-1",
      price: 150,
    });
    mapStripeStudentPlanStatusToPrismaMock.mockReturnValue("ACTIVE");
  });

  it("upserts student plan from payment intent and recomputes student flag", async () => {
    const expectedEndDate = new Date("2026-05-01T00:00:00.000Z");
    calculatePaymentIntentStudentPlanEndDateMock.mockResolvedValue(
      expectedEndDate,
    );
    txMock.studentPlan.upsert.mockResolvedValue({ id: "student-plan-1" });

    const paymentIntent = {
      id: "pi_123",
      status: "succeeded",
    } as any;

    const result = await upsertStudentPlanBasedOnPaymentIntentService(
      txMock as any,
      {
        studentId: "student-1",
        userPlanId: "plan-1",
      },
      "user-1",
      paymentIntent,
    );

    expect(result).toEqual({ id: "student-plan-1" });
    expect(txMock.studentPlan.upsert).toHaveBeenCalledWith({
      where: {
        stripeId: "pi_123",
      },
      create: {
        stripeId: "pi_123",
        studentId: "student-1",
        userPlanId: "plan-1",
        startDate: expect.any(Date),
        endDate: expectedEndDate,
        priceAtPurchase: 150,
        status: "ACTIVE",
      },
      update: {
        stripeId: "pi_123",
        studentId: "student-1",
        userPlanId: "plan-1",
        startDate: expect.any(Date),
        endDate: expectedEndDate,
        priceAtPurchase: 150,
        status: "ACTIVE",
      },
    });
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
  });

  it("upserts student plan from subscription dates and recomputes student flag", async () => {
    const startDate = new Date("2026-03-01T00:00:00.000Z");
    const endDate = new Date("2026-04-01T00:00:00.000Z");

    calculateSubscriptionStudentPlanDatesMock.mockResolvedValue({
      startDate,
      endDate,
    });
    txMock.studentPlan.upsert.mockResolvedValue({ id: "student-plan-2" });

    const subscription = {
      id: "sub_123",
      status: "active",
    } as any;

    const result = await upsertStudentPlanBasedOnSubscriptionService(
      txMock as any,
      {
        studentId: "student-1",
        userPlanId: "plan-1",
      },
      "user-1",
      subscription,
    );

    expect(result).toEqual({ id: "student-plan-2" });
    expect(txMock.studentPlan.upsert).toHaveBeenCalledWith({
      where: {
        stripeId: "sub_123",
      },
      create: {
        stripeId: "sub_123",
        studentId: "student-1",
        userPlanId: "plan-1",
        startDate,
        endDate,
        priceAtPurchase: 150,
        status: "ACTIVE",
      },
      update: {
        stripeId: "sub_123",
        studentId: "student-1",
        userPlanId: "plan-1",
        startDate,
        endDate,
        priceAtPurchase: 150,
        status: "ACTIVE",
      },
    });
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
  });

  it("cancels active student plan and recomputes active flag", async () => {
    txMock.studentPlan.findFirstOrThrow.mockResolvedValue({
      id: "student-plan-3",
      studentId: "student-1",
    });
    txMock.studentPlan.update.mockResolvedValue({
      id: "student-plan-3",
      status: "CANCELED",
    });

    const result = await cancelStudentPlanService(
      txMock as any,
      "student-plan-3",
      "user-1",
    );

    expect(result).toEqual({ id: "student-plan-3", status: "CANCELED" });
    expect(txMock.studentPlan.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "student-plan-3",
        status: "ACTIVE",
        endDate: {
          gt: expect.any(Date),
        },
        student: {
          userId: "user-1",
        },
      },
    });
    expect(txMock.studentPlan.update).toHaveBeenCalledWith({
      where: { id: "student-plan-3" },
      data: {
        status: "CANCELED",
        endDate: expect.any(Date),
      },
    });
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
  });
});
