import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus, UserRole } from "@prisma/client";
export async function checkSaasSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (res.locals.user?.role === UserRole.STUDENT) {
    return next();
  }

  const userId = res.locals.user.id;
  const subscription = await prisma.subscription.findFirst({
    where: {
      userId: userId,
      OR: [
        { status: SubscriptionStatus.ACTIVE },
        { status: SubscriptionStatus.TRIALING },
      ],
      currentPeriodEnd: {
        gte: new Date(), // garante que não está expirada
      },
    },
    orderBy: {
      currentPeriodStart: "desc", // a mais recente primeiro
    },
    include: {
      saasPlan: true,
    },
  });

  if (!subscription) {
    return res.status(403).json({ message: "No active subscription found" });
  }

  res.locals.subscription = subscription;
  res.locals.saasPlan = subscription.saasPlan;

  return next();
}

export default checkSaasSubscription;
