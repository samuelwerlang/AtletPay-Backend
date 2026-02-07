import config from "../../config/config.js";
import Stripe from "stripe";

const stripe = new Stripe(`${config.STRIPE_API_KEY}`);

interface CreateProductWithPriceInput {
  name: string;
  description: string;
  unitAmount: number;
  currency: "brl";
  stripeAccountId: string;
}

export async function createProductWithPriceService({
  name,
  description,
  unitAmount,
  currency,
  stripeAccountId,
}: CreateProductWithPriceInput) {
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
