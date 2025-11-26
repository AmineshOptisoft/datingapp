import { stripe } from './stripe';
import User from '@/models/User';
import UserSubscription from '@/models/UserSubscriptions';
import AIProfile from '@/models/AIProfile';
import Stripe from 'stripe';

/**
 * Get existing Stripe customer or create a new one
 */
export async function getOrCreateStripeCustomer(
    userId: string,
    email: string,
    name: string
): Promise<string> {
    try {
        // Check if user already has a Stripe customer ID
        const user = await User.findById(userId);

        if (user?.stripeCustomerId) {
            // Verify the customer exists in Stripe
            try {
                await stripe.customers.retrieve(user.stripeCustomerId);
                return user.stripeCustomerId;
            } catch (error) {
                console.log('Stripe customer not found, creating new one');
            }
        }

        // Create new Stripe customer
        const customer = await stripe.customers.create({
            email,
            name,
            metadata: {
                userId: userId.toString(),
            },
        });

        // Save customer ID to user record
        await User.findByIdAndUpdate(userId, {
            stripeCustomerId: customer.id,
        });

        return customer.id;
    } catch (error) {
        console.error('Error in getOrCreateStripeCustomer:', error);
        throw new Error('Failed to create or retrieve Stripe customer');
    }
}

/**
 * Create a Stripe checkout session for purchasing an AI profile
 */
// export async function createCheckoutSession(
//     userId: string,
//     email: string,
//     name: string,
//     aiProfileId: string,
//     planType: 'monthly' | 'annual' | 'lifetime'
// ): Promise<Stripe.Checkout.Session> {
//     try {

//         // console.log('AI profile:', aiProfileId);
//         // Get AI profile with pricing using profileId field (e.g., 'boy-210')
//         const aiProfile = await AIProfile.findOne({ profileId: aiProfileId });
//         console.log('AI profile:', aiProfile);
//         if (!aiProfile) {
//             throw new Error('AI Profile not found');
//         }

//         if (!aiProfile.pricing) {
//             throw new Error('Pricing information not available for this AI profile');
//         }

//         // Get the appropriate price ID based on plan type
//         let priceId: string;
//         let amount: number;

//         switch (planType) {
//             case 'monthly':
//                 priceId = aiProfile.pricing.monthlyPriceId;
//                 amount = aiProfile.pricing.monthlyPrice;
//                 break;
//             case 'annual':
//                 priceId = aiProfile.pricing.annualPriceId;
//                 amount = aiProfile.pricing.annualPrice;
//                 break;
//             case 'lifetime':
//                 priceId = aiProfile.pricing.lifetimePriceId;
//                 amount = aiProfile.pricing.lifetimePrice;
//                 break;
//             default:
//                 throw new Error('Invalid plan type');
//         }

//         if (!priceId) {
//             throw new Error(`Price ID not configured for ${planType} plan`);
//         }

//         // Get or create Stripe customer
//         const customerId = await getOrCreateStripeCustomer(userId, email, name);

//         // Create checkout session
//         const session = await stripe.checkout.sessions.create({
//             customer: customerId,
//             mode: 'subscription',
//             line_items: [
//                 {
//                     price: priceId,
//                     quantity: 1,
//                 },
//             ],
//             success_url: `http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
//             cancel_url: `http://localhost:3000/checkout/cancel`,
//             metadata: {
//                 userId: userId.toString(),
//                 aiProfileId: aiProfileId.toString(),
//                 planType,
//                 amount: amount.toString(),
//             },
//         });

//         return session;
//     } catch (error) {
//         console.error('Error creating checkout session:', error);
//         throw error;
//     }
// }


export async function createCheckoutSession(
    userId: string,
    email: string,
    name: string,
    aiProfileId: string,
    planType: 'monthly' | 'annual' | 'lifetime'
): Promise<Stripe.Checkout.Session> {
    try {
        const aiProfile = await AIProfile.findOne({ profileId: aiProfileId });
        if (!aiProfile || !aiProfile.pricing) {
            throw new Error('AI Profile or pricing not found');
        }

        let priceId: string;
        let amount: number;

        switch (planType) {
            case 'monthly':
                priceId = aiProfile.pricing.monthlyPriceId;
                amount = aiProfile.pricing.monthlyPrice;
                break;
            case 'annual':
                priceId = aiProfile.pricing.annualPriceId;
                amount = aiProfile.pricing.annualPrice;
                break;
            case 'lifetime':
                priceId = aiProfile.pricing.lifetimePriceId;
                amount = aiProfile.pricing.lifetimePrice;
                break;
            default:
                throw new Error('Invalid plan type');
        }

        // ensure stripe customer exists
        const customerId = await getOrCreateStripeCustomer(userId, email, name);

        // ▶️ Always create a subscription
        const session = await stripe.checkout.sessions.create({
            customer: customerId,
            mode: planType === 'lifetime' ? "payment" : "subscription",

            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],

            success_url: `http://localhost:3000/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `http://localhost:3000/checkout/cancel`,

            // Metadata on checkout session (optional but useful)
            metadata: {
                userId: userId.toString(),
                aiProfileId: aiProfileId.toString(),
                planType,
                amount: amount.toString(),
            },

            // 👇 MOST IMPORTANT: metadata on subscription
            subscription_data: {
                metadata: {
                    userId: userId.toString(),
                    aiProfileId: aiProfileId.toString(),
                    planType,
                    amount: amount.toString(),
                },
            },
        });

        return session;
    } catch (error) {
        console.error("Error creating checkout session:", error);
        throw error;
    }
}


/**
 * Handle subscription created event from Stripe webhook
 */
export async function handleSubscriptionCreated(
    subscription: Stripe.Subscription
): Promise<void> {
    try {
        const metadata = subscription.metadata;

        if (!metadata.userId || !metadata.aiProfileId || !metadata.planType) {
            console.error('Missing metadata in subscription:', subscription.id);
            return;
        }

        console.log('✅ Subscription created: hey', subscription.id);

        // Create subscription record
        await UserSubscription.create({
            userId: metadata.userId,
            aiProfileId: metadata.aiProfileId,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: subscription.customer as string,
            planType: metadata.planType,
            status: subscription.status,
            currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : undefined,
            currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
            cancelAtPeriodEnd: (subscription as any).cancel_at_period_end || false,
            priceId: subscription.items.data[0].price.id,
            amount: subscription.items.data[0].price.unit_amount || 0,
            currency: subscription.currency,
        });

        console.log('✅ Subscription created:', subscription.id);
    } catch (error) {
        console.error('Error handling subscription created:', error);
        throw error;
    }
}

/**
 * Handle subscription updated event from Stripe webhook
 */
export async function handleSubscriptionUpdated(
    subscription: Stripe.Subscription
): Promise<void> {
    try {
        await UserSubscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
                status: subscription.status,
                currentPeriodStart: (subscription as any).current_period_start ? new Date((subscription as any).current_period_start * 1000) : undefined,
                currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
                cancelAtPeriodEnd: (subscription as any).cancel_at_period_end,
            }
        );

        console.log('✅ Subscription updated:', subscription.id);
    } catch (error) {
        console.error('Error handling subscription updated:', error);
        throw error;
    }
}

/**
 * Handle subscription deleted event from Stripe webhook
 */
export async function handleSubscriptionDeleted(
    subscription: Stripe.Subscription
): Promise<void> {
    try {
        await UserSubscription.findOneAndUpdate(
            { stripeSubscriptionId: subscription.id },
            {
                status: 'canceled',
                cancelAtPeriodEnd: true,
            }
        );

        console.log('✅ Subscription deleted:', subscription.id);
    } catch (error) {
        console.error('Error handling subscription deleted:', error);
        throw error;
    }
}

/**
 * Handle one-time payment (lifetime purchase) from checkout session
 */
export async function handleCheckoutCompleted(
    session: Stripe.Checkout.Session
): Promise<void> {
    try {
        const metadata = session.metadata;

        if (!metadata || !metadata.userId || !metadata.aiProfileId || !metadata.planType) {
            console.error('Missing metadata in checkout session:', session.id);
            return;
        }

        // For lifetime purchases (one-time payment)
        if (metadata.planType === 'lifetime') {
            await UserSubscription.create({
                userId: metadata.userId,
                aiProfileId: metadata.aiProfileId,
                stripeSubscriptionId: session.id, // Use session ID for lifetime
                stripeCustomerId: session.customer as string,
                planType: 'lifetime',
                status: 'active',
                cancelAtPeriodEnd: false,
                priceId: session.line_items?.data[0]?.price?.id || '',
                amount: parseInt(metadata.amount || '0'),
                currency: session.currency || 'usd',
            });

            console.log('✅ Lifetime purchase completed:', session.id);
        }
        // For subscriptions, add metadata to the subscription
        else if (session.subscription) {
            const subscriptionId = typeof session.subscription === 'string'
                ? session.subscription
                : session.subscription.id;

            // Update the subscription with metadata
            await stripe.subscriptions.update(subscriptionId, {
                metadata: {
                    userId: metadata.userId,
                    aiProfileId: metadata.aiProfileId,
                    planType: metadata.planType,
                },
            });

            console.log('✅ Subscription metadata updated:', subscriptionId);
        }
    } catch (error) {
        console.error('Error handling checkout completed:', error);
        throw error;
    }
}
