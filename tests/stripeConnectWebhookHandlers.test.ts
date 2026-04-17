const upsertStudentPlanBasedOnSubscriptionServiceMock = jest.fn();
const upsertStudentPlanBasedOnPaymentIntentServiceMock = jest.fn();
const cancelStudentPlanServiceMock = jest.fn();
const createChargeServiceMock = jest.fn();
const markChargeFailedServiceMock = jest.fn();
const recomputeStudentActiveFlagMock = jest.fn();

const mockStripeClient = {
  webhooks: {
    constructEvent: jest.fn(),
  },
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

const txMock = {
  studentPlan: {
    findFirstOrThrow: jest.fn(),
  },
  charge: {
    update: jest.fn(),
    findFirstOrThrow: jest.fn(),
  },
};

const mockPrisma = {
  $transaction: jest.fn(),
  charge: {
    findFirst: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("../src/services/studentplans.services.js", () => ({
  upsertStudentPlanBasedOnSubscriptionService:
    upsertStudentPlanBasedOnSubscriptionServiceMock,
  upsertStudentPlanBasedOnPaymentIntentService:
    upsertStudentPlanBasedOnPaymentIntentServiceMock,
  cancelStudentPlanService: cancelStudentPlanServiceMock,
}));

jest.mock("../src/services/charges.services.js", () => ({
  createChargeService: createChargeServiceMock,
  markChargeFailedService: markChargeFailedServiceMock,
  markChargePaidService: jest.fn(),
}));

jest.mock("../src/services/students.services.js", () => ({
  recomputeStudentActiveFlag: recomputeStudentActiveFlagMock,
}));

jest.mock("@prisma/client", () => ({
  ChargeStatus: { PAID: "PAID", FAILED: "FAILED" },
  StudentPlanStatus: { ACTIVE: "ACTIVE", CANCELED: "CANCELED" },
}));

import stripeConnectRouter from "../src/routes/webHooks/stripeConnectWebhook.routes.js";

// Helper: build mock req/res and invoke the route handler directly via the
// router's stack – avoids HTTP and supertest while keeping the integration
// realistic.
function buildRequestMock(body: Buffer | string, signature = "valid_sig") {
  return {
    headers: { "stripe-signature": signature },
    body,
  } as any;
}

function buildResponseMock() {
  const res = {
    sendStatus: jest.fn().mockReturnThis(),
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
  };
  return res as any;
}

// Grab the async handler from the router so we can call it directly.
const routeLayer = (stripeConnectRouter as any).stack.find(
  (l: any) => l.route?.path === "/stripe/connect",
);
// The handler is the last callback in the layer's stack (after express.raw).
const connectHandler =
  routeLayer.route.stack[routeLayer.route.stack.length - 1].handle;

describe("stripeConnectWebhook route", () => {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {});
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {});

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
    // Default: transaction just calls the callback with txMock
    mockPrisma.$transaction.mockImplementation(async (cb: any) => cb(txMock));
  });

  // ─────────────────────────────────────────────
  // Signature verification
  // ─────────────────────────────────────────────
  it("returns 400 when webhook signature verification fails", async () => {
    mockStripeClient.webhooks.constructEvent.mockImplementation(() => {
      throw new Error("Invalid signature");
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(400);
  });

  // ─────────────────────────────────────────────
  // payment_intent.succeeded – one-time
  // ─────────────────────────────────────────────
  it("processes a one-time payment_intent.succeeded and creates charge + student plan", async () => {
    const paymentIntent = {
      id: "pi_123",
      amount: 9900,
      status: "succeeded",
      description: "Plano avulso",
      metadata: {
        payment_type: "one_time",
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: paymentIntent },
    });
    mockPrisma.charge.findFirst.mockResolvedValue(null);

    const createdCharge = { id: "charge-1" };
    const createdPlan = { id: "student-plan-1" };
    createChargeServiceMock.mockResolvedValue(createdCharge);
    upsertStudentPlanBasedOnPaymentIntentServiceMock.mockResolvedValue(
      createdPlan,
    );

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(createChargeServiceMock).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({
        studentId: "student-1",
        amount: 9900,
        externalId: "pi_123",
        status: "PAID",
      }),
    );
    expect(upsertStudentPlanBasedOnPaymentIntentServiceMock).toHaveBeenCalled();
    expect(txMock.charge.update).toHaveBeenCalledWith({
      where: { id: "charge-1" },
      data: { studentPlanId: "student-plan-1" },
    });
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores a payment_intent.succeeded that is not one_time", async () => {
    const paymentIntent = {
      id: "pi_sub",
      amount: 9900,
      status: "succeeded",
      metadata: { payment_type: "subscription" },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: paymentIntent },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(createChargeServiceMock).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("skips duplicate one-time payment (idempotency check)", async () => {
    const paymentIntent = {
      id: "pi_duplicate",
      amount: 9900,
      status: "succeeded",
      metadata: {
        payment_type: "one_time",
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: { object: paymentIntent },
    });
    mockPrisma.charge.findFirst.mockResolvedValue({ id: "charge-existing" });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(createChargeServiceMock).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // customer.subscription.created
  // ─────────────────────────────────────────────
  it("processes customer.subscription.created with valid metadata", async () => {
    const subscription = {
      id: "sub_123",
      status: "active",
      metadata: {
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.created",
      data: { object: subscription },
    });
    upsertStudentPlanBasedOnSubscriptionServiceMock.mockResolvedValue({});

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(
      upsertStudentPlanBasedOnSubscriptionServiceMock,
    ).toHaveBeenCalledWith(
      txMock,
      { studentId: "student-1", userPlanId: "plan-1" },
      "user-1",
      subscription,
    );
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores customer.subscription.created when metadata is missing", async () => {
    const subscription = {
      id: "sub_no_meta",
      status: "active",
      metadata: {},
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.created",
      data: { object: subscription },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(
      upsertStudentPlanBasedOnSubscriptionServiceMock,
    ).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // customer.subscription.updated
  // ─────────────────────────────────────────────
  it("processes customer.subscription.updated with valid metadata", async () => {
    const subscription = {
      id: "sub_upd",
      status: "active",
      metadata: {
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: subscription },
    });
    upsertStudentPlanBasedOnSubscriptionServiceMock.mockResolvedValue({});

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(upsertStudentPlanBasedOnSubscriptionServiceMock).toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores customer.subscription.updated when metadata is missing", async () => {
    const subscription = {
      id: "sub_upd_no_meta",
      status: "canceled",
      metadata: {},
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.updated",
      data: { object: subscription },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(
      upsertStudentPlanBasedOnSubscriptionServiceMock,
    ).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // customer.subscription.deleted
  // ─────────────────────────────────────────────
  it("processes customer.subscription.deleted and cancels student plan", async () => {
    const subscription = {
      id: "sub_del",
      status: "canceled",
      metadata: {
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: subscription },
    });
    txMock.studentPlan.findFirstOrThrow.mockResolvedValue({
      id: "student-plan-1",
    });
    cancelStudentPlanServiceMock.mockResolvedValue({});

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(txMock.studentPlan.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        studentId: "student-1",
        userPlanId: "plan-1",
        stripeId: "sub_del",
      },
      select: { id: true },
    });
    expect(cancelStudentPlanServiceMock).toHaveBeenCalledWith(
      txMock,
      "student-plan-1",
      "user-1",
    );
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores customer.subscription.deleted when metadata is missing", async () => {
    const subscription = {
      id: "sub_del_no_meta",
      status: "canceled",
      metadata: {},
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "customer.subscription.deleted",
      data: { object: subscription },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(cancelStudentPlanServiceMock).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // invoice.paid
  // ─────────────────────────────────────────────
  it("creates a charge on invoice.paid for a subscription_cycle", async () => {
    const subscription = {
      id: "sub_123",
      metadata: {
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
      items: { data: [{ price: { unit_amount: 9900 } }] },
    };

    const invoice = {
      id: "in_123",
      billing_reason: "subscription_cycle",
      parent: {
        subscription_details: { subscription: "sub_123" },
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "invoice.paid",
      data: { object: invoice },
    });
    mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
    createChargeServiceMock.mockResolvedValue({ id: "charge-1" });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(mockStripeClient.subscriptions.retrieve).toHaveBeenCalledWith(
      "sub_123",
      expect.anything(),
    );
    expect(createChargeServiceMock).toHaveBeenCalledWith(
      txMock,
      expect.objectContaining({
        studentId: "student-1",
        status: "PAID",
        amount: 9900,
        externalId: "in_123",
      }),
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores invoice.paid that is not subscription_create or subscription_cycle", async () => {
    const invoice = {
      id: "in_manual",
      billing_reason: "manual",
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "invoice.paid",
      data: { object: invoice },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(mockStripeClient.subscriptions.retrieve).not.toHaveBeenCalled();
    expect(createChargeServiceMock).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // invoice.payment_failed
  // ─────────────────────────────────────────────
  it("marks charge as failed on invoice.payment_failed", async () => {
    const subscription = {
      id: "sub_123",
      metadata: {
        studentId: "student-1",
        userPlanId: "plan-1",
        userId: "user-1",
      },
    };

    const invoice = {
      id: "in_failed",
      billing_reason: "subscription_cycle",
      parent: {
        subscription_details: { subscription: "sub_123" },
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: invoice },
    });
    mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);
    txMock.charge.findFirstOrThrow.mockResolvedValue({ id: "charge-1" });
    markChargeFailedServiceMock.mockResolvedValue({});

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(txMock.charge.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        OR: [{ externalId: "sub_123" }, { externalId: "in_failed" }],
      },
      select: { id: true },
    });
    expect(markChargeFailedServiceMock).toHaveBeenCalledWith(
      txMock,
      "charge-1",
    );
    expect(recomputeStudentActiveFlagMock).toHaveBeenCalledWith(
      txMock,
      "student-1",
    );
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  it("ignores invoice.payment_failed when subscription metadata is missing", async () => {
    const subscription = {
      id: "sub_no_meta",
      metadata: {},
    };

    const invoice = {
      id: "in_failed_no_meta",
      parent: {
        subscription_details: { subscription: "sub_no_meta" },
      },
    };

    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "invoice.payment_failed",
      data: { object: invoice },
    });
    mockStripeClient.subscriptions.retrieve.mockResolvedValue(subscription);

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(markChargeFailedServiceMock).not.toHaveBeenCalled();
    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // Default / unknown event type
  // ─────────────────────────────────────────────
  it("returns 200 for an unhandled event type", async () => {
    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "some.unknown.event",
      data: { object: {} },
    });

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(200);
  });

  // ─────────────────────────────────────────────
  // Internal error handling
  // ─────────────────────────────────────────────
  it("returns 500 when a handler throws unexpectedly", async () => {
    mockStripeClient.webhooks.constructEvent.mockReturnValue({
      type: "payment_intent.succeeded",
      data: {
        object: {
          id: "pi_err",
          amount: 100,
          status: "succeeded",
          metadata: {
            payment_type: "one_time",
            studentId: "student-1",
            userPlanId: "plan-1",
            userId: "user-1",
          },
        },
      },
    });
    mockPrisma.charge.findFirst.mockResolvedValue(null);
    mockPrisma.$transaction.mockRejectedValue(new Error("DB failure"));

    const req = buildRequestMock(Buffer.from("{}"));
    const res = buildResponseMock();

    await connectHandler(req, res);

    expect(res.sendStatus).toHaveBeenCalledWith(500);
  });
});
