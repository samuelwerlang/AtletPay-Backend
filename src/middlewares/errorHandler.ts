import { Prisma } from "@prisma/client";
import { Request, Response, NextFunction } from "express";

export function errorMiddleware(
  err: unknown,
  req: Request,
  res: Response,
  next: NextFunction,
) {
  // Erros do Prisma
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

  // Erros genéricos
  if (err instanceof Error) {
    return res.status(500).json({
      message: err.message,
    });
  }

  // Fallback extremo
  return res.status(500).json({
    message: "Internal server error",
  });
}
