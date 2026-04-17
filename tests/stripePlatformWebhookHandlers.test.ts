const createSubscriptionServiceMock = jest.fn();
const updateSubscriptionServiceMock = jest.fn();

const mockStripeClient = {
  subscriptions: {
    retrieve: jest.fn(),
  },
};

const StripeConstructorMock = jest.fn(() => mockStripeClient);

jest.mock("stripe", () => ({
  __esModule: true,
  default: StripeConstructorMock,
}));

jest.mock("../src/config/config.js", () => ({
  __esModule: true,
  default: {
    STRIPE_API_KEY: "sk_test_123",
    STRIPE_WEBHOOK_SECRET: "whsec_test",
  },
}));

const mockPrisma = {
  user: {
    update: jest.fn(),
    findFirst: jest.fn(),
  },
  saasPlan: {
    findUnique: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("../src/services/subscriptions.services.js", () => ({
  createSubscriptionService: createSubscriptionServiceMock,
  updateSubscriptionService: updateSubscriptionServiceMock,
}));

jest.mock("@prisma/client", () => ({
  SubscriptionStatus: {
    ACTIVE: "ACTIVE",
    INCOMPLETE: "INCOMPLETE",
    PAST_DUE: "PAST_DUE",
    CANCELED: "CANCELED",
    UNPAID: "UNPAID",
    TRIALING: "TRIALING",
  },
}));

import {
  handleCheckoutCompletedEvent,
  handleSubscriptionEvent,
  handleInvoiceEvent,
  getUserBasedOnCustomerId,
  getSaasPlanBasedOnPriceId,
  mapStripeStatusToPrisma,
} from "../src/utils/stripePlatformWebhookHandlers.js";

describe("stripePlatformWebhookHandlers", () => {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const consoleWarnSpy = jest
    .spyOn(console, "warn")
    .mockImplementation(() => {});
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleWarnSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // ─────────────────────────────────────────────
  // mapStripeStatusToPrisma
  // ─────────────────────────────────────────────
  describe("mapStripeStatusToPrisma", () => {
    it.each([
      ["active", "ACTIVE"],
      ["incomplete", "INCOMPLETE"],
      ["past_due", "PAST_DUE"],
      ["canceled", "CANCELED"],
      ["unpaid", "UNPAID"],
      ["trialing", "TRIALING"],
      ["unknown_value", "INCOMPLETE"],
    ])("maps stripe status '%s' to prisma status '%s'", (stripe, prisma) => {
      expect(mapStripeStatusToPrisma(stripe as any)).toBe(prisma);
    });
  });

  // ─────────────────────────────────────────────
  // getUserBasedOnCustomerId
  // ─────────────────────────────────────────────
  describe("getUserBasedOnCustomerId", () => {
    it("returns the user when found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });

      const result = await getUserBasedOnCustomerId("cus_123");

      expect(result).toEqual({ id: "user-1" });
      expect(mockPrisma.user.findFirst).toHaveBeenCalledWith({
        where: { stripeCustomerId: "cus_123" },
        select: { id: true },
      });
    });

    it("returns null and warns when user is not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);

      const result = await getUserBasedOnCustomerId("cus_not_found");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // getSaasPlanBasedOnPriceId
  // ─────────────────────────────────────────────
  describe("getSaasPlanBasedOnPriceId", () => {
    it("returns the saas plan when found", async () => {
      mockPrisma.saasPlan.findUnique.mockResolvedValue({ id: "plan-1" });

      const result = await getSaasPlanBasedOnPriceId("price_abc");

      expect(result).toEqual({ id: "plan-1" });
      expect(mockPrisma.saasPlan.findUnique).toHaveBeenCalledWith({
        where: { StripePriceId: "price_abc" },
        select: { id: true },
      });
    });

    it("returns null and warns when plan is not found", async () => {
      mockPrisma.saasPlan.findUnique.mockResolvedValue(null);

      const result = await getSaasPlanBasedOnPriceId("price_missing");

      expect(result).toBeNull();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // handleCheckoutCompletedEvent
  // ─────────────────────────────────────────────
  describe("handleCheckoutCompletedEvent", () => {
    it("updates user stripeCustomerId when userId and customerId are present", async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await handleCheckoutCompletedEvent({
        client_reference_id: "user-1",
        customer: "cus_123",
      } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { stripeCustomerId: "cus_123" },
      });
    });

    it("accepts customer as an object and extracts its id", async () => {
      mockPrisma.user.update.mockResolvedValue({});

      await handleCheckoutCompletedEvent({
        client_reference_id: "user-1",
        customer: { id: "cus_obj_123" },
      } as any);

      expect(mockPrisma.user.update).toHaveBeenCalledWith({
        where: { id: "user-1" },
        data: { stripeCustomerId: "cus_obj_123" },
      });
    });

    it("does not update user when userId is missing", async () => {
      await handleCheckoutCompletedEvent({
        client_reference_id: null,
        customer: "cus_123",
      } as any);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });

    it("does not update user when customer is missing", async () => {
      await handleCheckoutCompletedEvent({
        client_reference_id: "user-1",
        customer: null,
      } as any);

      expect(mockPrisma.user.update).not.toHaveBeenCalled();
      expect(consoleWarnSpy).toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // handleSubscriptionEvent
  // ─────────────────────────────────────────────
  describe("handleSubscriptionEvent", () => {
    const baseSubscription = {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      cancel_at_period_end: false,
      current_period_start: 1740000000,
      current_period_end: 1742678400,
      items: {
        data: [{ price: { id: "price_abc" } }],
      },
    } as any;

    it("calls createSubscriptionService when service is 'create'", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      mockPrisma.saasPlan.findUnique.mockResolvedValue({ id: "plan-1" });
      createSubscriptionServiceMock.mockResolvedValue({});

      await handleSubscriptionEvent(baseSubscription, "create");

      expect(createSubscriptionServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          saasPlanId: "plan-1",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
          status: "ACTIVE",
          cancelAtPeriodEnd: false,
        }),
      );
      expect(updateSubscriptionServiceMock).not.toHaveBeenCalled();
    });

    it("calls updateSubscriptionService when service is 'update'", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      mockPrisma.saasPlan.findUnique.mockResolvedValue({ id: "plan-1" });
      updateSubscriptionServiceMock.mockResolvedValue({});

      await handleSubscriptionEvent(baseSubscription, "update");

      expect(updateSubscriptionServiceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: "user-1",
          saasPlanId: "plan-1",
          stripeCustomerId: "cus_123",
          stripeSubscriptionId: "sub_123",
        }),
        "user-1",
      );
      expect(createSubscriptionServiceMock).not.toHaveBeenCalled();
    });

    it("does nothing when user is not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue(null);
      mockPrisma.saasPlan.findUnique.mockResolvedValue({ id: "plan-1" });

      await handleSubscriptionEvent(baseSubscription, "create");

      expect(createSubscriptionServiceMock).not.toHaveBeenCalled();
      expect(updateSubscriptionServiceMock).not.toHaveBeenCalled();
    });

    it("does nothing when saas plan is not found", async () => {
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      mockPrisma.saasPlan.findUnique.mockResolvedValue(null);

      await handleSubscriptionEvent(baseSubscription, "create");

      expect(createSubscriptionServiceMock).not.toHaveBeenCalled();
      expect(updateSubscriptionServiceMock).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // handleInvoiceEvent
  // ─────────────────────────────────────────────
  describe("handleInvoiceEvent", () => {
    const baseSubscription = {
      id: "sub_123",
      customer: "cus_123",
      status: "active",
      cancel_at_period_end: false,
      current_period_start: 1740000000,
      current_period_end: 1742678400,
      items: {
        data: [{ price: { id: "price_abc" } }],
      },
    } as any;

    it("ignores invoices that are not from a subscription cycle", async () => {
      await handleInvoiceEvent({
        id: "in_123",
        billing_reason: "subscription_create",
      } as any);

      expect(mockStripeClient.subscriptions.retrieve).not.toHaveBeenCalled();
    });

    it("retrieves subscription and calls handleSubscriptionEvent for a cycle invoice", async () => {
      mockStripeClient.subscriptions.retrieve.mockResolvedValue(
        baseSubscription,
      );
      mockPrisma.user.findFirst.mockResolvedValue({ id: "user-1" });
      mockPrisma.saasPlan.findUnique.mockResolvedValue({ id: "plan-1" });
      updateSubscriptionServiceMock.mockResolvedValue({});

      await handleInvoiceEvent({
        id: "in_123",
        billing_reason: "subscription_cycle",
        parent: {
          subscription_details: {
            subscription: "sub_123",
          },
        },
      } as any);

      expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith(
        "sub_123",
      );
      expect(updateSubscriptionServiceMock).toHaveBeenCalled();
    });
  });
});
