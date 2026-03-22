const usersServiceMock = {
  createUserService: jest.fn(),
  deleteUserService: jest.fn(),
  getUserService: jest.fn(),
  updateUserService: jest.fn(),
};

jest.mock("../src/services/users.service.js", () => usersServiceMock);

import {
  createUserController,
  deleteUserController,
  getUserController,
  updateUserController,
} from "../src/controllers/users.controller.js";

function createResponseMock() {
  const res = {
    status: jest.fn(),
    json: jest.fn(),
  };

  res.status.mockReturnValue(res);
  res.json.mockReturnValue(res);

  return res;
}

describe("users.controller", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("creates a user and falls back to the email prefix when name is missing", async () => {
    const req = {
      auth: {
        payload: {
          sub: "auth0|123",
          email: "sam@example.com",
        },
      },
    };
    const res = createResponseMock();
    const createdUser = { id: "user-1", email: "sam@example.com", name: "sam" };

    usersServiceMock.createUserService.mockResolvedValue(createdUser);

    await createUserController(req as any, res as any);

    expect(usersServiceMock.createUserService).toHaveBeenCalledWith({
      sub: "auth0|123",
      email: "sam@example.com",
      name: "sam",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(createdUser);
  });

  it("loads a user from the service and returns status 200", async () => {
    const req = {
      auth: {
        payload: {
          sub: "auth0|123",
          email: "sam@example.com",
        },
      },
    };
    const res = createResponseMock();
    const user = { id: "user-1", email: "sam@example.com", name: "Sam" };

    usersServiceMock.getUserService.mockResolvedValue(user);

    await getUserController(req as any, res as any);

    expect(usersServiceMock.getUserService).toHaveBeenCalledWith("auth0|123");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(user);
  });

  it("updates a user using the parsed auth payload", async () => {
    const req = {
      auth: {
        payload: {
          sub: "auth0|123",
          email: "sam@example.com",
          name: "Sam",
        },
      },
    };
    const res = createResponseMock();
    const updatedUser = { email: "sam@example.com", name: "Sam" };

    usersServiceMock.updateUserService.mockResolvedValue(updatedUser);

    await updateUserController(req as any, res as any);

    expect(usersServiceMock.updateUserService).toHaveBeenCalledWith({
      sub: "auth0|123",
      email: "sam@example.com",
      name: "Sam",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(updatedUser);
  });

  it("deletes a user using the parsed auth payload", async () => {
    const req = {
      auth: {
        payload: {
          sub: "auth0|123",
          email: "sam@example.com",
          name: "Sam",
        },
      },
    };
    const res = createResponseMock();
    const deletedUser = { email: "sam@example.com", name: "Sam" };

    usersServiceMock.deleteUserService.mockResolvedValue(deletedUser);

    await deleteUserController(req as any, res as any);

    expect(usersServiceMock.deleteUserService).toHaveBeenCalledWith({
      sub: "auth0|123",
      email: "sam@example.com",
      name: "Sam",
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(deletedUser);
  });
});
