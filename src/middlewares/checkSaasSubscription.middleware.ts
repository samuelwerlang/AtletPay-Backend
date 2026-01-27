import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";

export async function checkSaasSubscription(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const userAuth0Id = req.auth?.payload.sub;

  if (!userAuth0Id) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const subscription = await prisma.subscription.findFirst({
    where: {
      user: {
        auth0Id: userAuth0Id,
      },
    },
    include: {
      saasPlan: true,
    },
  });

  if (!subscription) {
    return res.status(403).json({ message: "No subscription found" });
  }

  if (subscription.status !== "ACTIVE") {
    return res.status(403).json({ message: "Subscription inactive" });
  }

  if (subscription.currentPeriodEnd <= new Date()) {
    return res.status(403).json({ message: "Subscription expired" });
  }

  res.locals.subscription = subscription;
  res.locals.saasPlan = subscription.saasPlan;

  return next();
}

export default checkSaasSubscription;
