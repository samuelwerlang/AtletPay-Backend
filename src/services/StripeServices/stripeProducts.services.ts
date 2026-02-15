import config from "../../config/config.js";
import Stripe from "stripe";

const stripe = new Stripe(`${config.STRIPE_API_KEY}`);

interface IStripeProduct {
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
}: IStripeProduct) {
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
}: IStripeProduct) {
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

export async function deleteProductService(stripeProductId: string) {
  try {
    const deletedProduct = await stripe.products.del(stripeProductId);
    return deletedProduct;
  } catch (error) {
    console.error(
      "[DELETE-PRODUCT-SERVICE] Failed to delete Stripe product",
      error,
    );
    throw error;
  }
}

export async function updateProductService(
  stripeProductId: string,
  { name, description }: IStripeProduct,
) {
  try {
    const updatedProduct = await stripe.products.update(stripeProductId, {
      name,
      description,
    });
    return updatedProduct;
  } catch (error) {
    console.error(
      "[UPDATE-PRODUCT-SERVICE] Failed to update Stripe product",
      error,
    );
    throw error;
  }
}
