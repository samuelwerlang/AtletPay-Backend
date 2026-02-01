import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";
export async function checkSaasSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userId = res.locals.user.id;
  const subscription = await prisma.subscription.findFirst({
    where: {
      user: {
        id: userId,
      },
    },
    include: {
      saasPlan: true,
    },
  });
  if (!subscription) {
    return res.status(403).json({ message: "No subscription found" });
  }

  switch (subscription.status) {
    case SubscriptionStatus.CANCELED:
      return res.status(403).json({ message: "Subscription canceled" });
    case SubscriptionStatus.INCOMPLETE:
      return res.status(403).json({ message: "Subscription incomplete" });
    case SubscriptionStatus.PAST_DUE:
      return res.status(403).json({ message: "Subscription past-due" });
    case SubscriptionStatus.UNPAID:
      return res.status(403).json({ message: "Subscription unpaid" });
    default:
      break;
  }

  if (subscription.currentPeriodEnd <= new Date()) {
    return res.status(403).json({ message: "Subscription expired" });
  }

  res.locals.subscription = subscription;
  res.locals.saasPlan = subscription.saasPlan;

  return next();
}

export default checkSaasSubscription;
