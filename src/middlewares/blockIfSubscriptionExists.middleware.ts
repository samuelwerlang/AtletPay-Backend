import { Request, Response, NextFunction } from "express";
import { prisma } from "../lib/prisma.js";
import { SubscriptionStatus } from "@prisma/client";

async function blockIfSubscriptionExists(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const user = res.locals.user;

  if (!user) {
    return res
      .status(500)
      .json({ message: "Could not find user in response context" });
  }

  const existingSubscription = await prisma.subscription.findFirst({
    where: {
      userId: user.id,
      status: {
        in: [
          SubscriptionStatus.ACTIVE,
          SubscriptionStatus.INCOMPLETE,
          SubscriptionStatus.TRIALING,
          SubscriptionStatus.UNPAID,
        ],
      },
    },
  });

  if (existingSubscription) {
    return res.status(409).json({
      message: "User already has an existing subscription",
    });
  }

  next();
}

export { blockIfSubscriptionExists };
