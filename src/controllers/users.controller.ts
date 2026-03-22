import * as z from "zod";
import { Request, Response } from "express";
import {
  createUserService,
  deleteUserService,
  updateUserService,
  getUserService,
} from "../services/users.service.js";
import { UserRole } from "@prisma/client";

const authUserInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  //email_verified: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

const createUserBodySchema = z.object({
  role: z.enum([UserRole.USER, UserRole.STUDENT]).optional(),
});

async function createUserController(req: Request, res: Response) {
  const parsedUserInfo = authUserInfoSchema.parse(req.auth!.payload);
  const parsedBody = createUserBodySchema.parse(req.body ?? {});

  const { sub, email, name } = parsedUserInfo;

  const displayName = name && name !== email ? name : email!.split("@")[0];

  const user = await createUserService({
    sub: sub,
    email: email,
    name: displayName,
    role: parsedBody.role,
  });

  return res.status(200).json(user);
}

async function getUserController(req: Request, res: Response) {
  const parsedUserInfo = authUserInfoSchema.parse(req.auth!.payload);
  const { sub } = parsedUserInfo;
  const user = await getUserService(sub);
  return res.status(200).json(user);
}

async function deleteUserController(req: Request, res: Response) {
  const parsedUserInfo = authUserInfoSchema.parse(req.auth!.payload);
  const deletedUser = await deleteUserService(parsedUserInfo);
  return res.status(200).json(deletedUser);
}

async function updateUserController(req: Request, res: Response) {
  const parsedUserInfo = authUserInfoSchema.parse(req.auth!.payload);
  const updatedUser = await updateUserService(parsedUserInfo);
  return res.status(200).json(updatedUser);
}

export {
  createUserController,
  getUserController,
  updateUserController,
  deleteUserController,
};
