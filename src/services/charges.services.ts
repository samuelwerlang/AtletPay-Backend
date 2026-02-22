import { Prisma } from "@prisma/client";
import { prisma } from "../lib/prisma.js";
import { ChargeStatus } from "@prisma/client";

interface ICharge {
  studentId: string;
  status: ChargeStatus; // aluno que vai pagar
  amount: number;
  externalId: string; // cents
  description?: string;
  paidAt?: Date;
}

interface IUpdateChargePayment {
  chargeId: string;
  studentPlanId?: string;
  externalId: string; // id do Stripe
}

async function createChargeService(
  tx: Prisma.TransactionClient,
  data: ICharge,
) {
  const { studentId, amount, description, status, externalId, paidAt } = data;

  return tx.charge.create({
    data: {
      studentId,
      amount,
      description,
      externalId,
      status,
      paidAt,
    },
  });
}

async function markChargePaidService(
  tx: Prisma.TransactionClient,
  data: IUpdateChargePayment,
) {
  const { chargeId, externalId, studentPlanId } = data;

  return await tx.charge.update({
    where: { id: chargeId },
    data: {
      status: ChargeStatus.PAID,
      paidAt: new Date(),
      externalId,
      studentPlanId,
    },
  });
}

async function markChargeFailedService(
  tx: Prisma.TransactionClient,
  chargeId: string,
) {
  return await tx.charge.update({
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
