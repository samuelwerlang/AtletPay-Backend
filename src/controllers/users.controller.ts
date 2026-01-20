import * as z from "zod";
import { Request, Response } from "express";
import { getOrCreateUserService } from "../services/users.service.js";

const userInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email(),
  email_verified: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

async function createUserController(req: Request, res: Response) {
  const parsedUserInfo = userInfoSchema.parse(req.auth?.payload);

  const { sub, email, name } = parsedUserInfo;

  const displayName = name && name !== email ? name : email!.split("@")[0];

  const user = await getOrCreateUserService({
    auth0Id: sub,
    email,
    name: displayName,
  });

  return res.status(200).json(user);
}

export default createUserController;
