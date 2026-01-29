import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

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
    case "CANCELED":
      return res.status(403).json({ message: "Subscription canceled" });
    case "INCOMPLETE":
      return res.status(403).json({ message: "Subscription incomplete" });
    case "PAST_DUE":
      return res.status(403).json({ message: "Subscription past-due" });
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
