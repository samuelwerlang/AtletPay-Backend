import { prisma } from "../lib/prisma.js";
import { SaasPlanType } from "@prisma/client";

interface ISaasPlanInfo {
  name: string;
  price: number;
  maxPlans?: number;
  maxStudents?: number;
  StripePriceId: string;
  type: SaasPlanType;
}

async function createSaasPlanService(data: ISaasPlanInfo) {
  const { name, price, StripePriceId, type, maxPlans, maxStudents } = data;

  if (!name || !price || !StripePriceId || !type) {
    throw new Error("Missing required SaasPlan fields");
  }

  const existingSaasPlan = await prisma.saasPlan.findUnique({
    where: { StripePriceId: data.StripePriceId },
  });

  if (existingSaasPlan) {
    return existingSaasPlan;
  }

  const saasPlan = await prisma.saasPlan.create({
    data: {
      name: data.name,
      price: data.price,
      maxPlans: data.maxPlans,
      maxStudents: data.maxStudents,
      StripePriceId: data.StripePriceId,
      type: data.type,
    },
  });

  return saasPlan;
}

export default createSaasPlanService;
