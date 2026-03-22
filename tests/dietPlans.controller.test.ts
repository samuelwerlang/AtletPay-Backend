const dietPlansServiceMock = {
  createDietPlanService: jest.fn(),
  getAllDietPlansService: jest.fn(),
  getDietPlanByIdService: jest.fn(),
  updateDietPlanService: jest.fn(),
  deleteDietPlanService: jest.fn(),
  getMealsLibraryService: jest.fn(),
};

jest.mock("../src/services/dietPlans.services.js", () => dietPlansServiceMock);

import {
  createDietPlanController,
  getMealsLibraryController,
} from "../src/controllers/dietPlans.controller.js";

function createResponseMock() {
  const res = {
    locals: {},
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe("dietPlans.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is missing from response locals", async () => {
    const req = {
      body: {
        name: "Dieta base",
        startDate: "2026-03-16T10:00:00.000Z",
        studentId: "0bece9db-4033-4d9b-9ce2-b0f89156b13b",
        meals: [
          {
            name: "Cafe da manha",
          },
        ],
      },
    };
    const res = createResponseMock();

    await createDietPlanController(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(dietPlansServiceMock.createDietPlanService).not.toHaveBeenCalled();
  });

  it("returns meal library for current user", async () => {
    const req = {};
    const res = createResponseMock();
    const meals = [{ id: "meal-1", name: "Frango + arroz" }];
    res.locals = { user: { id: "user-1" } };

    dietPlansServiceMock.getMealsLibraryService.mockResolvedValue(meals);

    await getMealsLibraryController(req as any, res as any);

    expect(dietPlansServiceMock.getMealsLibraryService).toHaveBeenCalledWith(
      "user-1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(meals);
  });
});
