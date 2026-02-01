import { prisma } from "../lib/prisma.js";

const getUserBasedOnCustomerId = async (stripeCustomerId: string) => {
  const user = await prisma.user.findFirst({
    where: {
      stripeCustomerId,
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    console.warn("User associated with the given stripeCustomerId not found");
    return null;
  }
  return user;
};

const getSaasPlanBasedOnPriceId = async (priceId: string) => {
  const saasPlan = await prisma.saasPlan.findUnique({
    where: { StripePriceId: priceId },
    select: { id: true },
  });
  if (!saasPlan) {
    console.warn("SaasPlan não encontrado para Price:", priceId);
    return null;
  }

  return saasPlan;
};

async function getSubscriptionPeriod(sub: any) {
  const startSec =
    sub.current_period_start ?? sub.items?.data?.[0]?.current_period_start;
  const endSec =
    sub.current_period_end ?? sub.items?.data?.[0]?.current_period_end;
  return {
    currentPeriodStart: startSec ? new Date(startSec * 1000) : new Date(),
    currentPeriodEnd: endSec ? new Date(endSec * 1000) : new Date(),
  };
}

export {
  getUserBasedOnCustomerId,
  getSaasPlanBasedOnPriceId,
  getSubscriptionPeriod,
};
