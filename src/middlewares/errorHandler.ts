import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Prisma Errors
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2025":
        return res.status(404).json({ message: "Resource not found" });

      case "P2002":
        return res.status(409).json({ message: "Duplicate resource" });

      case "P2003":
        return res.status(400).json({ message: "Invalid relation" });
    }
  }
  //Zod errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: "Validation error",
      issues: err.issues,
    });
  }

  //Default Errors
  if (err instanceof Error) {
    return res.status(500).json({
      message: err.message,
    });
  }

  // Fallback
  return res.status(500).json({
    message: "Internal server error",
  });
}
