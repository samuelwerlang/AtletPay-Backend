const trainingSheetsServiceMock = {
  createTrainingSheetService: jest.fn(),
  getAllTrainingSheetsService: jest.fn(),
  getTrainingSheetByIdService: jest.fn(),
  updateTrainingSheetService: jest.fn(),
  deleteTrainingSheetService: jest.fn(),
};

jest.mock("../src/services/trainingsheets.services.js", () =>
  trainingSheetsServiceMock,
);

import {
  createTrainingSheetController,
  getAllTrainingSheetsController,
} from "../src/controllers/trainingSheets.controller.js";

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

describe("trainingSheets.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when user is missing from response locals", async () => {
    const req = {
      body: {
        name: "Treino A",
        startDate: "2026-03-16T10:00:00.000Z",
        studentId: "0bece9db-4033-4d9b-9ce2-b0f89156b13b",
        exercises: [
          {
            exerciseName: "Supino",
            sets: 4,
            repetitions: "10",
          },
        ],
      },
    };
    const res = createResponseMock();

    await createTrainingSheetController(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(trainingSheetsServiceMock.createTrainingSheetService).not.toHaveBeenCalled();
  });

  it("returns all training sheets for current user", async () => {
    const req = {
      query: {},
    };
    const res = createResponseMock();
    const data = [{ id: "sheet-1", name: "Treino A" }];
    res.locals = { user: { id: "user-1" } };

    trainingSheetsServiceMock.getAllTrainingSheetsService.mockResolvedValue(data);

    await getAllTrainingSheetsController(req as any, res as any);

    expect(trainingSheetsServiceMock.getAllTrainingSheetsService).toHaveBeenCalledWith(
      "user-1",
      undefined,
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(data);
  });
});
