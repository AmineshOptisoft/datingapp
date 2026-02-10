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
    profileId: string,
    planType: 'monthly' | 'annual' | 'lifetime'
): Promise<Stripe.Checkout.Session> {
    try {
        let priceId: string;
       let amount: number;
        let characterName = 'Character';

        // Check if this is a user-created character (starts with 'character-')
        if (profileId.startsWith('character-')) {
            // User-created characters have fixed monthly pricing
            const monthlyPrice = parseFloat(process.env.NEXT_PUBLIC_USER_CHARACTER_PRICE || "2");
            
            // For user characters, only monthly is supported
            if (planType !== 'monthly') {
                throw new Error('User-created characters only support monthly subscriptions');
            }

            amount = monthlyPrice * 100; // Convert to cents for Stripe
            
            // Try to fetch character name
            try {
                const charId = profileId.replace('character-', '');
                const userWithChar = await User.findOne({ "characters._id": charId }).lean();
                if (userWithChar) {
                    const char = (userWithChar as any).characters.find((c: any) => c._id.toString() === charId);
                    if (char) characterName = char.characterName;
                }
            } catch (e) {
                console.error("Error fetching character name:", e);
            }

            // Create a Stripe price for this user character monthly subscription
            const product = await stripe.products.create({
                name: `${characterName} - Monthly Subscription`,
                description: `Monthly access to ${characterName} with unrestricted content`,
            });

            const price = await stripe.prices.create({
                product: product.id,
                unit_amount: amount,
                currency: 'usd',
                recurring: {
                    interval: 'month',
                },
            });

            priceId = price.id;
        } else {
            // AI Profile lookup
            const aiProfile = await AIProfile.findOne({ profileId });
            if (!aiProfile || !aiProfile.pricing) {
                throw new Error('AI Profile or pricing not found');
            }

            characterName = aiProfile.name;

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
        }

        // ensure stripe customer exists
        const customerId = await getOrCreateStripeCustomer(userId, email, name);

        // Prepare metadata
        const metadata = {
            userId: userId.toString(),
            aiProfileId: profileId.toString(),
            planType,
            amount: amount.toString(),
        };

        // Create checkout session with different configurations for payment vs subscription
        const sessionConfig: Stripe.Checkout.SessionCreateParams = {
            customer: customerId,
            mode: planType === 'lifetime' ? "payment" : "subscription",
            line_items: [
                {
                    price: priceId,
                    quantity: 1,
                },
            ],
            success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}&profileId=${profileId}`,
            cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel?profileId=${profileId}`,  
            metadata,
        };

        // Add payment_intent_data for one-time payments (lifetime)
        if (planType === 'lifetime') {
            sessionConfig.payment_intent_data = {
                metadata,
            };
        } else {
            // Add subscription_data for recurring payments (monthly/annual)
            sessionConfig.subscription_data = {
                metadata,
            };
        }

        const session = await stripe.checkout.sessions.create(sessionConfig);

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

        if (!metadata || !metadata.userId) {
            console.error('Missing userId in checkout session:', session.id);
            return;
        }

        // **NEW: Check if this is a COIN PURCHASE (not a subscription)**
        if (metadata.packageId && metadata.coins) {
            console.log('💰 Detected coin purchase in checkout session');
            
            try {
                const { WalletService } = await import('@/lib/walletService');
                
                await WalletService.addCoins({
                    userId: metadata.userId,
                    amount: parseInt(metadata.coins),
                    description: `Purchased ${metadata.packageId} package via Stripe`,
                    type: 'purchase',
                    packageType: metadata.packageId as 'starter' | 'popular' | 'premium',
                    stripePaymentId: session.payment_intent as string,
                    stripeSessionId: session.id,
                });

                console.log(`✅ Successfully credited ${metadata.coins} coins to user ${metadata.userId}`);
                return; // Exit early - this was a coin purchase, not a subscription
            } catch (coinError) {
                console.error('❌ Failed to credit coins:', coinError);
                throw coinError;
            }
        }

        // **EXISTING: Handle subscription/lifetime purchases**
        if (!metadata.aiProfileId || !metadata.planType) {
            console.error('Missing metadata in checkout session:', session.id);
            return;
        }

        // For lifetime purchases (one-time payment)
        if (metadata.planType === 'lifetime') {
            // Retrieve the full session with expanded line_items to get price info
            const fullSession = await stripe.checkout.sessions.retrieve(session.id, {
                expand: ['line_items', 'payment_intent'],
            });

            let priceId = '';
            let amount = parseInt(metadata.amount || '0');
            let currency = session.currency || 'usd';

            // Get price info from line items if available
            if (fullSession.line_items && fullSession.line_items.data.length > 0) {
                const lineItem = fullSession.line_items.data[0];
                if (lineItem.price) {
                    priceId = lineItem.price.id;
                    amount = lineItem.price.unit_amount || amount;
                }
            }

            // Get payment intent metadata if available (as backup)
            if (fullSession.payment_intent && typeof fullSession.payment_intent === 'object') {
                const paymentIntent = fullSession.payment_intent as Stripe.PaymentIntent;
                if (paymentIntent.metadata) {
                    // Use payment intent metadata if session metadata is incomplete
                    metadata.userId = metadata.userId || paymentIntent.metadata.userId;
                    metadata.aiProfileId = metadata.aiProfileId || paymentIntent.metadata.aiProfileId;
                    metadata.planType = metadata.planType || paymentIntent.metadata.planType;
                    metadata.amount = metadata.amount || paymentIntent.metadata.amount;
                }
            }

            await UserSubscription.create({
                userId: metadata.userId,
                aiProfileId: metadata.aiProfileId,
                stripeSubscriptionId: session.id, // Use session ID for lifetime
                stripeCustomerId: session.customer as string,
                planType: 'lifetime',
                status: 'active',
                cancelAtPeriodEnd: false,
                priceId,
                amount,
                currency,
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

/**
 * Handle payment intent succeeded event (backup for lifetime purchases)
 */
export async function handlePaymentIntentSucceeded(
    paymentIntent: Stripe.PaymentIntent
): Promise<void> {
    try {
        const metadata = paymentIntent.metadata;

        if (!metadata || !metadata.userId || !metadata.aiProfileId || !metadata.planType) {
            console.log('Payment intent missing metadata, likely not a lifetime purchase:', paymentIntent.id);
            return;
        }

        // Only process lifetime purchases
        if (metadata.planType !== 'lifetime') {
            console.log('Payment intent is not for lifetime plan, skipping:', paymentIntent.id);
            return;
        }

        // Check if we already created a subscription for this payment
        const existingSubscription = await UserSubscription.findOne({
            userId: metadata.userId,
            aiProfileId: metadata.aiProfileId,
            planType: 'lifetime',
            amount: paymentIntent.amount,
        });

        if (existingSubscription) {
            console.log('Lifetime subscription already exists for this payment, skipping:', paymentIntent.id);
            return;
        }

        // Try to find priceId from the checkout session
        let priceId = '';

        // Search for checkout sessions with this payment intent
        const sessions = await stripe.checkout.sessions.list({
            payment_intent: paymentIntent.id,
            limit: 1,
        });

        if (sessions.data.length > 0) {
            const session = await stripe.checkout.sessions.retrieve(sessions.data[0].id, {
                expand: ['line_items'],
            });

            if (session.line_items && session.line_items.data.length > 0) {
                const lineItem = session.line_items.data[0];
                if (lineItem.price) {
                    priceId = lineItem.price.id;
                }
            }
        }

        // Fallback: if still no priceId, we can't create the record
        if (!priceId) {
            console.error('Could not retrieve priceId for payment intent:', paymentIntent.id);
            throw new Error('Missing priceId for lifetime purchase');
        }

        await UserSubscription.create({
            userId: metadata.userId,
            aiProfileId: metadata.aiProfileId,
            stripeSubscriptionId: paymentIntent.id, // Use payment intent ID
            stripeCustomerId: paymentIntent.customer as string,
            planType: 'lifetime',
            status: 'active',
            cancelAtPeriodEnd: false,
            priceId,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
        });

        console.log('✅ Lifetime purchase completed via payment_intent.succeeded:', paymentIntent.id);
    } catch (error) {
        console.error('Error handling payment intent succeeded:', error);
        throw error;
    }
}
