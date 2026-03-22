const studentAccessServiceMock = {
  claimStudentAccessService: jest.fn(),
  getStudentPortalDataService: jest.fn(),
};

jest.mock("../src/services/studentAccess.services.js", () =>
  studentAccessServiceMock,
);

import {
  claimStudentAccessController,
  getStudentPortalDataController,
} from "../src/controllers/studentAccess.controller.js";

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

describe("studentAccess.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when claim is requested without loaded user", async () => {
    const req = {};
    const res = createResponseMock();

    await claimStudentAccessController(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(studentAccessServiceMock.claimStudentAccessService).not.toHaveBeenCalled();
  });

  it("returns student portal payload for linked student", async () => {
    const req = {};
    const res = createResponseMock();
    const payload = { id: "student-1", name: "Aluno" };

    res.locals = { user: { id: "user-1" } };
    studentAccessServiceMock.getStudentPortalDataService.mockResolvedValue(payload);

    await getStudentPortalDataController(req as any, res as any);

    expect(studentAccessServiceMock.getStudentPortalDataService).toHaveBeenCalledWith(
      "user-1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(payload);
  });
});
