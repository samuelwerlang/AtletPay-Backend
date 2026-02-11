import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ChargeStatus } from "@prisma/client";

interface ICreateCharge {
  studentId: string; // aluno que vai pagar
  amount: number; // em centavos
  description?: string;
}

interface IUpdateChargePayment {
  chargeId: string;
  studentPlanId?: string;
  externalId: string; // id do Stripe
  paidAt: Date;
}

async function createChargeService(
  tx: Prisma.TransactionClient,
  data: ICreateCharge,
) {
  const { studentId, amount, description } = data;

  // Check if the student already has an open or paid charge
  const existingCharge = await tx.charge.findFirst({
    where: {
      studentId,
      status: {
        in: [ChargeStatus.PENDING, ChargeStatus.PAID],
      },
    },
    select: { id: true },
  });

  if (existingCharge) {
    throw new Error("Student already has an active charge");
  }

  return tx.charge.create({
    data: {
      studentId,
      amount,
      description,
      status: ChargeStatus.PENDING,
    },
  });
}

async function markChargePaidService(
  tx: Prisma.TransactionClient,
  data: IUpdateChargePayment,
) {
  const { chargeId, externalId, paidAt, studentPlanId } = data;

  return await tx.charge.update({
    where: { id: chargeId },
    data: {
      status: ChargeStatus.PAID,
      externalId,
      paidAt,
      studentPlanId,
    },
  });
}

async function markChargeFailedService(chargeId: string) {
  return await prisma.charge.update({
    where: { id: chargeId },
    data: { status: ChargeStatus.FAILED },
  });
}

async function cancelChargeService(chargeId: string) {
  return await prisma.charge.update({
    where: { id: chargeId },
    data: { status: ChargeStatus.CANCELED },
  });
}

async function getStudentCharges(studentId: string) {
  return await prisma.charge.findMany({
    where: { studentId },
  });
}

async function getPendingChargesService(studentIds: string[]) {
  return await prisma.charge.findMany({
    where: {
      studentId: { in: studentIds }, // IDs dos alunos do personal
      status: ChargeStatus.PENDING,
    },
  });
}

export {
  createChargeService,
  markChargePaidService,
  markChargeFailedService,
  cancelChargeService,
  getStudentCharges,
  getPendingChargesService,
};
