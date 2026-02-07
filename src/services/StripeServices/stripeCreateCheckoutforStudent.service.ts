// import config from "../../config/config.js";
// import Stripe from "stripe";

// const stripe = new Stripe(`${config.STRIPE_API_KEY}`);

// interface studentCheckoutInfo {
//   priceId: string;
//   stripeAccountId: string;
// }
// export async function createStudentCheckoutService({
//   priceId,
//   stripeAccountId,
// }: studentCheckoutInfo) {
//   // Get the price's type from Stripe
//   const price = await stripe.prices.retrieve(priceId, {
//     stripeAccount: stripeAccountId, // Retrieve price from the connected account
//   });
//   const priceType = price.type;
//   const mode = priceType === "recurring" ? "subscription" : "payment";

//   const session = await stripe.checkout.sessions.create(
//     {
//       line_items: [
//         {
//           price: priceId,
//           quantity: 1,
//         },
//       ],
//       mode: mode,
//       // Defines where Stripe will redirect a customer after successful payment
//       success_url: `${process.env.DOMAIN}/done?session_id={CHECKOUT_SESSION_ID}`,
//       // Defines where Stripe will redirect if a customer cancels payment
//       cancel_url: `${process.env.DOMAIN}`,
//       ...(mode === "subscription"
//         ? {
//             subscription_data: {},
//           }
//         : {
//             payment_intent_data: {},
//           }),
//     },
//     {
//       stripeAccount: stripeAccountId,
//     },
//   );
// }
