import { Request, Response, NextFunction } from "express";
import { UserRole } from "@prisma/client";

async function blockStudentBilling(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const currentUser = res.locals.user;

  if (!currentUser?.id) {
    return res
      .status(401)
      .json({ message: "User not loaded in request context" });
  }

  if (currentUser.role === UserRole.STUDENT) {
    return res.status(403).json({
      message:
        "Student accounts cannot create subscriptions or checkout sessions",
    });
  }

  return next();
}

export default blockStudentBilling;
