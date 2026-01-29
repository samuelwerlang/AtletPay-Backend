import { prisma } from "../lib/prisma.js";
import { Request, Response, NextFunction } from "express";

async function checkPlanLimit(req: Request, res: Response, next: NextFunction) {
  const { maxPlans } = res.locals.maxPlans;
  const userMaxPlansCount = await prisma.userPlan.count({
    where: {
      userId: res.locals.user!.id,
    },
  });

  if (userMaxPlansCount >= maxPlans) {
    return res.status(403).json({
      message: "User plans limit reached",
    });
  }

  return next();
}

export default checkPlanLimit;
