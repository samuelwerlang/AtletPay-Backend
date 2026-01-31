import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function getCurrentUser(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const auth0Id = req.auth!.payload.sub;

  const user = await prisma.user.findUniqueOrThrow({
    where: { auth0Id },
  });
  
  res.locals.user = user;
  return next();
}

export default getCurrentUser;
