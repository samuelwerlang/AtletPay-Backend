const txMock = {
  subscription: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn(),
  subscription: {
    upsert: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("@prisma/client", () => ({
  SubscriptionStatus: {
    ACTIVE: "ACTIVE",
    PAST_DUE: "PAST_DUE",
    INCOMPLETE: "INCOMPLETE",
    CANCELED: "CANCELED",
  },
}));

import {
  createSubscriptionService,
  updateSubscriptionService,
} from "../src/services/subscriptions.services.js";

describe("subscriptions.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPrisma.$transaction.mockImplementation(async (callback: any) =>
      callback(txMock),
    );
  });

  it("rejects creation when the user already has an active subscription", async () => {
    txMock.subscription.findFirst.mockResolvedValue({ status: "ACTIVE" });

    await expect(
      createSubscriptionService({
        userId: "user-1",
        saasPlanId: "plan-1",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "ACTIVE" as any,
        currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      }),
    ).rejects.toThrow(
      "User already has an active or pending subscription (ACTIVE)",
    );

    expect(txMock.subscription.create).not.toHaveBeenCalled();
  });

  it("creates a subscription inside a transaction", async () => {
    const createdSubscription = { id: "subscription-1" };

    txMock.subscription.findFirst.mockResolvedValue(null);
    txMock.subscription.create.mockResolvedValue(createdSubscription);

    const result = await createSubscriptionService({
      userId: "user-1",
      saasPlanId: "plan-1",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      status: "ACTIVE" as any,
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
    });

    expect(result).toEqual(createdSubscription);
    expect(txMock.subscription.create).toHaveBeenCalledWith({
      data: {
        userId: "user-1",
        saasPlanId: "plan-1",
        stripeCustomerId: "cus_123",
        stripeSubscriptionId: "sub_123",
        status: "ACTIVE",
        currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
        currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
      },
    });
  });

  it("upserts subscriptions by stripe subscription id and user id", async () => {
    const subscriptionData = {
      userId: "user-1",
      saasPlanId: "plan-1",
      stripeCustomerId: "cus_123",
      stripeSubscriptionId: "sub_123",
      status: "ACTIVE" as any,
      currentPeriodStart: new Date("2026-03-01T00:00:00.000Z"),
      currentPeriodEnd: new Date("2026-04-01T00:00:00.000Z"),
    };

    mockPrisma.subscription.upsert.mockResolvedValue({ id: "subscription-1" });

    await updateSubscriptionService(subscriptionData, "user-1");

    expect(mockPrisma.subscription.upsert).toHaveBeenCalledWith({
      where: {
        stripeSubscriptionId: "sub_123",
        userId: "user-1",
      },
      update: subscriptionData,
      create: subscriptionData,
    });
  });
});
