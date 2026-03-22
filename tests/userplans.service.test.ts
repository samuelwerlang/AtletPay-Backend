const mockPrisma = {
  user: {
    findUnique: jest.fn(),
  },
  userPlan: {
    findFirst: jest.fn(),
    create: jest.fn(),
    updateMany: jest.fn(),
    findFirstOrThrow: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
  },
};

const createRecurrentProductServiceMock = jest.fn();
const createOneTimeProductServiceMock = jest.fn();
const archiveStripeProductServiceMock = jest.fn();
const updateStripeProductServiceMock = jest.fn();

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

jest.mock("@prisma/client", () => ({
  UserPlanRecurringIntervalType: {
    MONTHLY: "MONTHLY",
    BIMONTHLY: "BIMONTHLY",
    TRIMONTHLY: "TRIMONTHLY",
    SEMIANNUALLY: "SEMIANNUALLY",
    ANUALLY: "ANUALLY",
  },
}));

jest.mock("../src/services/stripeServices/stripeProducts.services.js", () => ({
  createRecurrentProductService: createRecurrentProductServiceMock,
  createOneTimeProductService: createOneTimeProductServiceMock,
  archiveStripeProductService: archiveStripeProductServiceMock,
  updateStripeProductService: updateStripeProductServiceMock,
}));

import {
  createUserPlanService,
  getUserPlanService,
  updateUserPlanService,
  deleteUserPlanService,
  getAllUserPlansService,
} from "../src/services/userplans.services.js";

describe("userplans.service", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects creating a plan when name already exists for user", async () => {
    mockPrisma.userPlan.findFirst.mockResolvedValue({ id: "existing-plan" });

    await expect(
      createUserPlanService(
        {
          name: "Premium",
          price: 150,
          description: "Plano premium",
          durationInMonths: 3,
          sessionsPerWeek: 3,
          isRecurrent: false,
        },
        "user-1",
        "acct_1",
      ),
    ).rejects.toThrow("Plan with this name already exists");
  });

  it("creates recurrent plan using mapped interval count", async () => {
    mockPrisma.userPlan.findFirst.mockResolvedValue(null);
    createRecurrentProductServiceMock.mockResolvedValue({
      productId: "prod_1",
      priceId: "price_1",
    });
    mockPrisma.userPlan.create.mockResolvedValue({ id: "plan-1" });

    const result = await createUserPlanService(
      {
        name: "Premium",
        price: 150,
        description: "Plano premium",
        durationInMonths: 3,
        sessionsPerWeek: 3,
        isRecurrent: true,
        intervalType: "MONTHLY" as any,
      },
      "user-1",
      "acct_1",
    );

    expect(result).toEqual({ id: "plan-1" });
    expect(createRecurrentProductServiceMock).toHaveBeenCalledWith({
      name: "Premium",
      description: "Plano premium",
      unitAmount: 150,
      currency: "brl",
      stripeAccountId: "acct_1",
      intervalCount: 1,
    });
    expect(mockPrisma.userPlan.create).toHaveBeenCalledWith({
      data: {
        name: "Premium",
        price: 150,
        description: "Plano premium",
        durationInMonths: 1,
        sessionsPerWeek: 3,
        userId: "user-1",
        isRecurrent: true,
        intervalType: "MONTHLY",
        stripeProductId: "prod_1",
        stripePriceId: "price_1",
        stripeAccountId: "acct_1",
      },
    });
  });

  it("creates one-time plan with one-time stripe product", async () => {
    mockPrisma.userPlan.findFirst.mockResolvedValue(null);
    createOneTimeProductServiceMock.mockResolvedValue({
      productId: "prod_ot",
      priceId: "price_ot",
    });
    mockPrisma.userPlan.create.mockResolvedValue({ id: "plan-2" });

    const result = await createUserPlanService(
      {
        name: "Avulso",
        price: 90,
        description: "Pagamento avulso",
        durationInMonths: 2,
        sessionsPerWeek: 2,
        isRecurrent: false,
      },
      "user-1",
      "acct_1",
    );

    expect(result).toEqual({ id: "plan-2" });
    expect(createOneTimeProductServiceMock).toHaveBeenCalledWith({
      name: "Avulso",
      description: "Pagamento avulso",
      unitAmount: 90,
      currency: "brl",
      stripeAccountId: "acct_1",
      intervalCount: undefined,
    });
  });

  it("updates user plan and syncs stripe product", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      stripeAccountId: "acct_1",
    });
    mockPrisma.userPlan.findFirst.mockResolvedValue({
      id: "plan-1",
      stripeProductId: "prod_1",
      name: "Original",
      description: "Descricao original",
    });
    mockPrisma.userPlan.updateMany.mockResolvedValue({ count: 1 });

    const result = await updateUserPlanService(
      { name: "Novo nome" },
      "user-1",
      "plan-1",
    );

    expect(result).toEqual({ count: 1 });
    expect(updateStripeProductServiceMock).toHaveBeenCalledWith(
      "prod_1",
      "Original",
      "Descricao original",
      "acct_1",
    );
  });

  it("rejects update when user is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null);

    await expect(
      updateUserPlanService({ name: "Novo nome" }, "user-1", "plan-1"),
    ).rejects.toThrow("[UPDATE-USER-SERVICE] User not found");
  });

  it("rejects update when user plan is missing", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({ id: "user-1" });
    mockPrisma.userPlan.findFirst.mockResolvedValue(null);

    await expect(
      updateUserPlanService({ name: "Novo nome" }, "user-1", "plan-1"),
    ).rejects.toThrow("[UPDATE-USER-SERVICE] UserPlan not found");
  });

  it("rejects update when plan is not owned by user", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      stripeAccountId: "acct_1",
    });
    mockPrisma.userPlan.findFirst.mockResolvedValue({
      id: "plan-1",
      stripeProductId: "prod_1",
      name: "Original",
      description: "Descricao original",
    });
    mockPrisma.userPlan.updateMany.mockResolvedValue({ count: 0 });

    await expect(
      updateUserPlanService({ name: "Novo nome" }, "user-1", "plan-1"),
    ).rejects.toThrow("Plan not found or not owned by user");
  });

  it("gets one user plan by id and owner", async () => {
    mockPrisma.userPlan.findFirstOrThrow.mockResolvedValue({ id: "plan-1" });

    const result = await getUserPlanService("plan-1", "user-1");

    expect(result).toEqual({ id: "plan-1" });
    expect(mockPrisma.userPlan.findFirstOrThrow).toHaveBeenCalledWith({
      where: {
        id: "plan-1",
        userId: "user-1",
      },
    });
  });

  it("deletes user plan and archives stripe product", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      stripeAccountId: "acct_1",
    });
    mockPrisma.userPlan.findFirst.mockResolvedValue({
      id: "plan-1",
      stripeProductId: "prod_1",
    });
    mockPrisma.userPlan.deleteMany.mockResolvedValue({ count: 1 });

    const result = await deleteUserPlanService("plan-1", "user-1");

    expect(result).toEqual({ count: 1 });
    expect(archiveStripeProductServiceMock).toHaveBeenCalledWith(
      "prod_1",
      "acct_1",
    );
  });

  it("rejects delete when user plan has no stripe product id", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      stripeAccountId: "acct_1",
    });
    mockPrisma.userPlan.findFirst.mockResolvedValue({
      id: "plan-1",
      stripeProductId: "",
    });

    await expect(deleteUserPlanService("plan-1", "user-1")).rejects.toThrow(
      "[DELETE-USERPLAN-SERVICE] stripeProductId not found",
    );
  });

  it("rejects delete when no plan was deleted", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      id: "user-1",
      stripeAccountId: "acct_1",
    });
    mockPrisma.userPlan.findFirst.mockResolvedValue({
      id: "plan-1",
      stripeProductId: "prod_1",
    });
    mockPrisma.userPlan.deleteMany.mockResolvedValue({ count: 0 });

    await expect(deleteUserPlanService("plan-1", "user-1")).rejects.toThrow(
      "Plan not found or not owned by user",
    );
  });

  it("lists all user plans ordered by createdAt desc", async () => {
    mockPrisma.userPlan.findMany.mockResolvedValue([{ id: "plan-1" }]);

    const result = await getAllUserPlansService("user-1");

    expect(result).toEqual([{ id: "plan-1" }]);
    expect(mockPrisma.userPlan.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
      orderBy: { createdAt: "desc" },
    });
  });
});
