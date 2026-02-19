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

export async function archiveStripeProductService(
  stripeProductId: string,
  stripeAccountId: string,
) {
  try {
    const deletedProduct = await stripe.products.update(
      stripeProductId,
      {
        active: false,
      },
      {
        stripeAccount: stripeAccountId,
      },
    );
    return deletedProduct;
  } catch (error) {
    console.error(
      "[DELETE-PRODUCT-SERVICE] Failed to delete Stripe product",
      error,
    );
    throw error;
  }
}

export async function updateStripeProductService(
  stripeProductId: string,
  name: string,
  description: string,
  stripeAccountId: string,
) {
  if (!stripeProductId) {
    throw new Error("Stripe product ID is required");
  }

  try {
    const updateParams: Stripe.ProductUpdateParams = {
      name,
      description,
    };

    const updatedProduct = await stripe.products.update(
      stripeProductId,
      updateParams,
      {
        stripeAccount: stripeAccountId,
      },
    );
    console.log(
      `[UPDATE-PRODUCT-SERVICE] Successfully updated product: ${stripeProductId}`,
    );

    return updatedProduct;
  } catch (error: any) {
    console.error(
      `[UPDATE-PRODUCT-SERVICE] Failed to update Stripe product ${stripeProductId}:`,
      error.message,
    );
    throw error;
  }
}
