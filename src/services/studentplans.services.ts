import pkg from "@prisma/client";
const { StudentPlanStatus } = pkg;
import type { Prisma as PrismaType } from "@prisma/client";
import Stripe from "stripe";
import { recomputeStudentActiveFlag } from "./students.services.js";
import {
  calculateSubscriptionStudentPlanDates,
  calculatePaymentIntentStudentPlanEndDate,
  fetchStudentBasedOnUserId,
  fetchUserPlanBasedOnUserId,
  checkActiveStudentPlan,
  mapStripeStudentPlanStatusToPrisma,
} from "../utils/studentPlanServiceHandlers.js";
export interface IStudentPlan {
  studentId: string;
  userPlanId: string;
}

async function upsertStudentPlanBasedOnPaymentIntentService(
  tx: PrismaType.TransactionClient,
  studentPlanInfo: IStudentPlan,
  userId: string,
  stripePaymentIntent: Stripe.PaymentIntent,
) {
  const { studentId, userPlanId } = studentPlanInfo;
  await fetchStudentBasedOnUserId(tx, studentId, userId);
  const userPlan = await fetchUserPlanBasedOnUserId(tx, userPlanId, userId);
  const userPlanEndDate = await calculatePaymentIntentStudentPlanEndDate(
    tx,
    userPlan!.id!,
    userId,
  );

  const createdStudentPlan = await tx.studentPlan.upsert({
    where: {
      stripeId: stripePaymentIntent.id,
    },
    create: {
      stripeId: stripePaymentIntent.id,
      studentId,
      userPlanId,
      startDate: new Date(),
      endDate: userPlanEndDate,
      priceAtPurchase: userPlan.price,
      status: mapStripeStudentPlanStatusToPrisma(stripePaymentIntent.status),
    },
    update: {
      stripeId: stripePaymentIntent.id,
      studentId,
      userPlanId,
      startDate: new Date(),
      endDate: userPlanEndDate,
      priceAtPurchase: userPlan.price,
      status: mapStripeStudentPlanStatusToPrisma(stripePaymentIntent.status),
    },
  });

  //Update Student isActive Flag
  await recomputeStudentActiveFlag(tx, studentId);
  return createdStudentPlan;
}

async function upsertStudentPlanBasedOnSubscriptionService(
  tx: PrismaType.TransactionClient,
  studentPlanInfo: IStudentPlan,
  userId: string,
  stripeSubscription: Stripe.Subscription,
) {
  const { studentId, userPlanId } = studentPlanInfo;
  await fetchStudentBasedOnUserId(tx, studentId, userId);
  const userPlan = await fetchUserPlanBasedOnUserId(tx, userPlanId, userId);
  const studentPlanDates =
    await calculateSubscriptionStudentPlanDates(stripeSubscription);

  // Upsert Plan
  const createdStudentPlan = await tx.studentPlan.upsert({
    where: {
      stripeId: stripeSubscription.id,
    },
    create: {
      stripeId: stripeSubscription.id,
      studentId,
      userPlanId,
      startDate: studentPlanDates.startDate,
      endDate: studentPlanDates.endDate,
      priceAtPurchase: userPlan.price,
      status: mapStripeStudentPlanStatusToPrisma(stripeSubscription.status),
    },
    update: {
      stripeId: stripeSubscription.id,
      studentId,
      userPlanId,
      startDate: studentPlanDates.startDate,
      endDate: studentPlanDates.endDate,
      priceAtPurchase: userPlan.price,
      status: mapStripeStudentPlanStatusToPrisma(stripeSubscription.status),
    },
  });

  //Update Student isActive Flag
  await recomputeStudentActiveFlag(tx, studentId);
  return createdStudentPlan;
}

async function cancelStudentPlanService(
  tx: PrismaType.TransactionClient,
  studentPlanId: string,
  userId: string,
) {
  // Make sure the plan exists, is active and belong to the user
  const studentPlan = await tx.studentPlan.findFirstOrThrow({
    where: {
      id: studentPlanId,
      status: StudentPlanStatus.ACTIVE,
      endDate: {
        gt: new Date(),
      },
      student: {
        userId: userId,
      },
    },
  });

  const updatedStudentPlan = await tx.studentPlan.update({
    where: { id: studentPlan.id },
    data: {
      status: StudentPlanStatus.CANCELED,
      endDate: new Date(),
    },
  });
  // Recompute the student flag
  await recomputeStudentActiveFlag(tx, studentPlan.studentId);
  return updatedStudentPlan;
}

export {
  upsertStudentPlanBasedOnSubscriptionService,
  upsertStudentPlanBasedOnPaymentIntentService,
  cancelStudentPlanService,
};
