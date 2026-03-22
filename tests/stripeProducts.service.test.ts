const mockStripeClient = {
  products: {
    create: jest.fn(),
    update: jest.fn(),
  },
  prices: {
    create: jest.fn(),
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
  },
}));

import {
  createRecurrentProductService,
  createOneTimeProductService,
  archiveStripeProductService,
  updateStripeProductService,
} from "../src/services/stripeServices/stripeProducts.services.js";

describe("stripeProducts.service", () => {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {
    // mute log output in tests
  });
  const consoleErrorSpy = jest
    .spyOn(console, "error")
    .mockImplementation(() => {
      // mute error output in tests
    });

  afterAll(() => {
    consoleLogSpy.mockRestore();
    consoleErrorSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates recurrent stripe product and monthly recurring price", async () => {
    mockStripeClient.products.create.mockResolvedValue({ id: "prod_1" });
    mockStripeClient.prices.create.mockResolvedValue({ id: "price_1" });

    const result = await createRecurrentProductService({
      name: "Plano Mensal",
      description: "Descricao",
      unitAmount: 15000,
      currency: "brl",
      stripeAccountId: "acct_1",
      intervalCount: 2,
    });

    expect(result).toEqual({ productId: "prod_1", priceId: "price_1" });
    expect(mockStripeClient.products.create).toHaveBeenCalledWith(
      {
        name: "Plano Mensal",
        description: "Descricao",
      },
      { stripeAccount: "acct_1" },
    );
    expect(mockStripeClient.prices.create).toHaveBeenCalledWith(
      {
        product: "prod_1",
        unit_amount: 15000,
        currency: "brl",
        recurring: {
          interval: "month",
          interval_count: 2,
        },
      },
      { stripeAccount: "acct_1" },
    );
  });

  it("creates one-time stripe product and price", async () => {
    mockStripeClient.products.create.mockResolvedValue({ id: "prod_ot" });
    mockStripeClient.prices.create.mockResolvedValue({ id: "price_ot" });

    const result = await createOneTimeProductService({
      name: "Plano Avulso",
      description: "Descricao",
      unitAmount: 9900,
      currency: "brl",
      stripeAccountId: "acct_1",
    });

    expect(result).toEqual({ productId: "prod_ot", priceId: "price_ot" });
    expect(mockStripeClient.prices.create).toHaveBeenCalledWith(
      {
        product: "prod_ot",
        unit_amount: 9900,
        currency: "brl",
      },
      { stripeAccount: "acct_1" },
    );
  });

  it("archives a stripe product", async () => {
    mockStripeClient.products.update.mockResolvedValue({
      id: "prod_1",
      active: false,
    });

    const result = await archiveStripeProductService("prod_1", "acct_1");

    expect(result).toEqual({ id: "prod_1", active: false });
    expect(mockStripeClient.products.update).toHaveBeenCalledWith(
      "prod_1",
      { active: false },
      { stripeAccount: "acct_1" },
    );
  });

  it("propagates archive errors", async () => {
    mockStripeClient.products.update.mockRejectedValue(
      new Error("Stripe down"),
    );

    await expect(
      archiveStripeProductService("prod_1", "acct_1"),
    ).rejects.toThrow("Stripe down");

    expect(consoleErrorSpy).toHaveBeenCalled();
  });

  it("rejects update when stripe product id is missing", async () => {
    await expect(
      updateStripeProductService("", "Novo nome", "Nova descricao", "acct_1"),
    ).rejects.toThrow("Stripe product ID is required");
  });

  it("updates stripe product metadata", async () => {
    mockStripeClient.products.update.mockResolvedValue({ id: "prod_1" });

    const result = await updateStripeProductService(
      "prod_1",
      "Novo nome",
      "Nova descricao",
      "acct_1",
    );

    expect(result).toEqual({ id: "prod_1" });
    expect(mockStripeClient.products.update).toHaveBeenCalledWith(
      "prod_1",
      {
        name: "Novo nome",
        description: "Nova descricao",
      },
      { stripeAccount: "acct_1" },
    );
  });

  it("propagates update errors", async () => {
    mockStripeClient.products.update.mockRejectedValue(
      new Error("Unauthorized"),
    );

    await expect(
      updateStripeProductService(
        "prod_1",
        "Novo nome",
        "Nova descricao",
        "acct_1",
      ),
    ).rejects.toThrow("Unauthorized");

    expect(consoleErrorSpy).toHaveBeenCalled();
  });
});
