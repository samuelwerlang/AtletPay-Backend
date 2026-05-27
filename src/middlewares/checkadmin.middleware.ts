import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import pkg from "@prisma/client";
const { UserRole } = pkg;

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  try {
    const userAuth0Id = req.auth?.payload.sub;

    if (!userAuth0Id) {
      return res.status(401).json({ message: "Unauthenticated" });
    }

    const user = await prisma.user.findUnique({
      where: { auth0Id: userAuth0Id },
      select: { role: true },
    });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (user.role !== UserRole.ADMIN) {
      return res.status(403).json({ message: "Forbidden" });
    }

    return next();
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Internal server error" });
  }
}

export default requireAdmin;
