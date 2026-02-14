import config from "../../config/config.js";
import Stripe from "stripe";

const stripe = new Stripe(`${config.STRIPE_API_KEY}`);

interface ICreateProduct {
  name: string;
  description: string;
  unitAmount: number;
  currency: "brl";
  stripeAccountId: string;
  recurring?: boolean;
  intervalCount?: number;
}

export async function createRecurrentProductService({
  name,
  description,
  unitAmount,
  currency,
  stripeAccountId,
  intervalCount,
}: ICreateProduct) {
  const product = await stripe.products.create(
    {
      name,
      description,
    },
    { stripeAccount: stripeAccountId },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,
      unit_amount: unitAmount,
      currency,
      recurring: {
        interval: "month",
        interval_count: intervalCount,
      },
    },
    { stripeAccount: stripeAccountId },
  );

  return {
    productId: product.id,
    priceId: price.id,
  };
}

export async function createOneTimeProductService({
  name,
  description,
  unitAmount,
  currency,
  stripeAccountId,
}: ICreateProduct) {
  const product = await stripe.products.create(
    {
      name,
      description,
    },
    { stripeAccount: stripeAccountId },
  );

  const price = await stripe.prices.create(
    {
      product: product.id,
      unit_amount: unitAmount,
      currency,
    },
    { stripeAccount: stripeAccountId },
  );

  return {
    productId: product.id,
    priceId: price.id,
  };
}
