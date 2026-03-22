const studentsServiceMock = {
  createStudentService: jest.fn(),
  deleteStudentService: jest.fn(),
  getStudentByIdService: jest.fn(),
  getAllStudentsService: jest.fn(),
  updateStudentService: jest.fn(),
  getActiveStudentsService: jest.fn(),
};

jest.mock("../src/services/students.services.js", () => studentsServiceMock);

import {
  createStudentController,
  getActiveStudentsController,
} from "../src/controllers/students.controller.js";

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

describe("students.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 when the user is missing from response locals", async () => {
    const req = {
      body: {
        name: "Student",
        email: "student@example.com",
      },
    };
    const res = createResponseMock();

    await createStudentController(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      message: "User not loaded in request context",
    });
    expect(studentsServiceMock.createStudentService).not.toHaveBeenCalled();
  });

  it("returns 403 when the plan limit is reached", async () => {
    const req = {
      body: {
        name: "Student",
        email: "student@example.com",
      },
    };
    const res = createResponseMock();
    res.locals = {
      user: { id: "user-1" },
      saasPlan: { maxStudents: 1 },
    };

    studentsServiceMock.createStudentService.mockRejectedValue({
      code: "MAX_STUDENTS_REACHED",
    });

    await createStudentController(req as any, res as any);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      message: "Students limit reached",
    });
  });

  it("returns active students for the current user", async () => {
    const req = {};
    const res = createResponseMock();
    const students = [{ id: "student-1", name: "Student" }];
    res.locals = {
      user: { id: "user-1" },
    };

    studentsServiceMock.getActiveStudentsService.mockResolvedValue(students);

    await getActiveStudentsController(req as any, res as any);

    expect(studentsServiceMock.getActiveStudentsService).toHaveBeenCalledWith(
      "user-1",
    );
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(students);
  });
});
