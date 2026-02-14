import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUnique({
    where: { auth0Id },
  });

  if (!user) {
    return res.status(404).json({
      message: "User not found",
    });
  }

  res.locals.user = user;
  return next();
}

export default getCurrentUser;
