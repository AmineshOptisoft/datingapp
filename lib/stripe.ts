import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error('STRIPE_SECRET_KEY is not defined in environment variables');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
    // Allow newer API versions even if the installed Stripe SDK's type union
    // lags behind; runtime supports it as long as Stripe accepts the version.
    apiVersion: '2025-12-15.clover' as Stripe.LatestApiVersion,
    typescript: true,
});
