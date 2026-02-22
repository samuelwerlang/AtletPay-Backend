import config from "../config/config.js";
import Stripe from "stripe";
import { Prisma } from "@prisma/client";
import { StudentPlanStatus } from "@prisma/client";

const stripe = new Stripe(config.STRIPE_API_KEY);

function mapStripeStudentPlanStatusToPrisma(
  status: Stripe.Subscription.Status | Stripe.PaymentIntent.Status,
) {
  switch (status) {
    // SUBSCRIPTION STATUS
    case "active":
      return StudentPlanStatus.ACTIVE;
    case "incomplete":
      return StudentPlanStatus.INCOMPLETE;
    case "past_due":
      return StudentPlanStatus.PAST_DUE;
    case "canceled":
      return StudentPlanStatus.CANCELED;
    case "unpaid":
      return StudentPlanStatus.UNPAID;
    case "trialing":
      return StudentPlanStatus.TRIALING;
    // PAYMENT INTENT STATUS
    case "paused":
      return StudentPlanStatus.PAUSED;
    case "processing":
      return StudentPlanStatus.PROCESSING;
    case "incomplete_expired":
      return StudentPlanStatus.INCOMPLETE_EXPIRED;
    case "requires_action":
      return StudentPlanStatus.REQUIRES_ACTION;
    case "requires_capture":
      return StudentPlanStatus.REQUIRES_CAPTURE;
    case "requires_confirmation":
      return StudentPlanStatus.REQUIRES_CONFIRMATION;
    case "requires_payment_method":
      return StudentPlanStatus.REQUIRES_PAYMENT_METHOD;
    case "succeeded":
      return StudentPlanStatus.SUCCEEDED;
    default:
      return StudentPlanStatus.INCOMPLETE;
  }
}

async function calculatePaymentIntentStudentPlanEndDate(
  tx: Prisma.TransactionClient,
  userPlanId: string,
  userId: string,
) {
  const userPlan = await fetchUserPlanBasedOnUserId(tx, userPlanId!, userId!);

  const now = new Date();
  const studentPlanEndDate = new Date(now);
  studentPlanEndDate.setMonth(
    studentPlanEndDate.getMonth() + userPlan.durationInMonths!,
  );
  if (now > studentPlanEndDate) {
    throw new Error("Invalid time interval");
  }
  return studentPlanEndDate;
}

async function calculateSubscriptionStudentPlanDates(sub: Stripe.Subscription) {
  const startSec = sub.items?.data?.[0]?.current_period_start;
  const endSec = sub.items?.data?.[0]?.current_period_end;
  return {
    startDate: startSec ? new Date(startSec * 1000) : new Date(),
    endDate: endSec ? new Date(endSec * 1000) : new Date(),
  };
}

async function fetchUserPlanBasedOnUserId(
  tx: Prisma.TransactionClient,
  userPlanId: string,
  userId: string,
) {
  const userPlan = await tx.userPlan.findFirstOrThrow({
    where: {
      id: userPlanId,
      userId,
    },
    select: {
      id: true,
      durationInMonths: true,
      price: true,
    },
  });
  return userPlan;
}

async function fetchStudentBasedOnUserId(
  tx: Prisma.TransactionClient,
  studentId: string,
  userId: string,
) {
  const student = await tx.student.findFirstOrThrow({
    where: {
      id: studentId,
      userId,
    },
    select: {
      id: true,
    },
  });
  return student;
}

async function checkActiveStudentPlan(
  tx: Prisma.TransactionClient,
  studentId: string,
) {
  const now = new Date();
  const activePlan = await tx.studentPlan.findFirst({
    where: {
      studentId,
      status: StudentPlanStatus.ACTIVE,
      endDate: {
        gt: now,
      },
    },
    select: { id: true },
  });
  return activePlan;
}

export {
  calculateSubscriptionStudentPlanDates,
  calculatePaymentIntentStudentPlanEndDate,
  fetchStudentBasedOnUserId,
  fetchUserPlanBasedOnUserId,
  checkActiveStudentPlan,
  mapStripeStudentPlanStatusToPrisma,
};
