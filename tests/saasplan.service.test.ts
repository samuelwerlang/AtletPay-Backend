const mockPrisma = {
  saasPlan: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
};

jest.mock("../src/lib/prisma.js", () => ({
  prisma: mockPrisma,
}));

import createSaasPlanService from "../src/services/saasplan.services.js";

describe("saasplan.service", () => {
  const consoleLogSpy = jest.spyOn(console, "log").mockImplementation(() => {
    // mute service logs in tests
  });

  afterAll(() => {
    consoleLogSpy.mockRestore();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("rejects when required fields are missing", async () => {
    await expect(
      createSaasPlanService({
        name: "Starter",
        price: 0,
        StripePriceId: "",
        type: "MONTHLY" as any,
      }),
    ).rejects.toThrow("Missing required SaasPlan fields");

    expect(mockPrisma.saasPlan.findUnique).not.toHaveBeenCalled();
  });

  it("returns the existing saas plan when stripe price already exists", async () => {
    const existing = { id: "saas-1", StripePriceId: "price_1" };
    mockPrisma.saasPlan.findUnique.mockResolvedValue(existing);

    const result = await createSaasPlanService({
      name: "Starter",
      price: 129,
      StripePriceId: "price_1",
      type: "MONTHLY" as any,
    });

    expect(result).toEqual({ saasPlan: existing, created: false });
    expect(mockPrisma.saasPlan.create).not.toHaveBeenCalled();
  });

  it("creates a new saas plan when stripe price is new", async () => {
    const created = { id: "saas-2" };
    mockPrisma.saasPlan.findUnique.mockResolvedValue(null);
    mockPrisma.saasPlan.create.mockResolvedValue(created);

    const result = await createSaasPlanService({
      name: "Pro",
      price: 199,
      StripePriceId: "price_new",
      type: "MONTHLY" as any,
      maxPlans: 20,
      maxStudents: 100,
    });

    expect(result).toEqual(created);
    expect(mockPrisma.saasPlan.create).toHaveBeenCalledWith({
      data: {
        name: "Pro",
        price: 199,
        maxPlans: 20,
        maxStudents: 100,
        StripePriceId: "price_new",
        type: "MONTHLY",
      },
    });
  });
});
