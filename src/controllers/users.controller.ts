import * as z from "zod";
import { Request, Response } from "express";
import { createUserService } from "../services/users.service.js";

const userInfoSchema = z.object({
  sub: z.string().min(1),
  email: z.email().optional(),
  email_verified: z.boolean().optional(),
  name: z.string().min(1).optional(),
});

async function createUserController(req: Request, res: Response) {
  try {
    console.log(req.auth?.payload);
    const parsedUserInfo = userInfoSchema.safeParse(req.auth?.payload);

    if (!parsedUserInfo.success) {
      return res.status(401).json({
        message: "Invalid access token claims",
        issues: parsedUserInfo.error.issues,
      });
    }

    const { sub, email, email_verified, name } = parsedUserInfo.data;

    if (!email || !sub) {
      return res.status(400).json({
        message: "Missing user information in token",
      });
    }

    const displayName = name && name !== email ? name : email.split("@")[0];

    const user = await createUserService({
      auth0Id: sub,
      email,
      name: displayName,
    });

    return res.status(201).json(user);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Internal server error" });
  }
}

export default createUserController;
