import { ZodError } from "zod";

import { errorMiddleware } from "../src/middlewares/errorHandler.js";

function createResponseMock() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe("errorMiddleware", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for zod validation errors", () => {
    const res = createResponseMock();
    const error = new ZodError([
      {
        code: "invalid_type",
        expected: "string",
        input: undefined,
        path: ["email"],
        message: "Invalid input: expected string, received undefined",
      },
    ]);

    errorMiddleware(error, {} as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith({
      message: "Validation error",
      issues: error.issues,
    });
  });

  it("returns 500 for generic errors", () => {
    const res = createResponseMock();

    errorMiddleware(new Error("Boom"), {} as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({ message: "Boom" });
  });

  it("returns a generic 500 for unknown values", () => {
    const res = createResponseMock();

    errorMiddleware("boom", {} as any, res as any, jest.fn());

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith({
      message: "Internal server error",
    });
  });
});
