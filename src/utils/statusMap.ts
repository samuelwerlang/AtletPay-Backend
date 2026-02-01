import Stripe from "stripe";
import { SubscriptionStatus } from "@prisma/client";
function mapStripeStatusToPrisma(status: Stripe.Subscription.Status) {
  switch (status) {
    case "active":
      return SubscriptionStatus.ACTIVE;
    case "incomplete":
      return SubscriptionStatus.INCOMPLETE;
    case "past_due":
      return SubscriptionStatus.PAST_DUE;
    case "canceled":
      return SubscriptionStatus.CANCELED;
    case "unpaid":
      return SubscriptionStatus.UNPAID;
    case "trialing":
      return SubscriptionStatus.TRIALING;
    default:
      return SubscriptionStatus.INCOMPLETE;
  }
}

export { mapStripeStatusToPrisma };
