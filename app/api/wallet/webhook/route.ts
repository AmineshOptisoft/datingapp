import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';
import { WalletService } from '@/lib/walletService';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

export async function POST(request: NextRequest) {
  try {
    // Check webhook secret at runtime, not build time
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    
    if (!webhookSecret) {
      console.error('❌ STRIPE_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }
    const body = await request.text();
    const headersList = await headers();
    const signature = headersList.get('stripe-signature');

    if (!signature) {
      console.error('❌ No Stripe signature found');
      return NextResponse.json(
        { error: 'No signature' },
        { status: 400 }
      );
    }

    // Verify webhook signature
    let event: Stripe.Event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err: any) {
      console.error('❌ Webhook signature verification failed:', err.message);
      return NextResponse.json(
        { error: `Webhook Error: ${err.message}` },
        { status: 400 }
      );
    }

    // Handle checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      const session = event.data.object as Stripe.Checkout.Session;

      console.log('✅ Payment successful:', session.id);
      console.log('📦 Metadata:', session.metadata);

      const { userId, packageId, coins } = session.metadata || {};

      if (!userId || !coins) {
        console.error('❌ Missing metadata in session');
        return NextResponse.json(
          { error: 'Missing metadata' },
          { status: 400 }
        );
      }

      // Credit coins to user's wallet
      try {
        await WalletService.addCoins({
          userId,
          amount: parseInt(coins),
          description: `Purchased ${packageId} package via Stripe`,
          type: 'purchase',
          packageType: packageId as 'starter' | 'popular' | 'premium',
          stripePaymentId: session.payment_intent as string,
        });

        console.log(`💰 Successfully credited ${coins} coins to user ${userId}`);

      } catch (walletError: any) {
        console.error('❌ Failed to credit coins:', walletError);
        return NextResponse.json(
          { error: 'Failed to credit coins' },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ received: true });

  } catch (error: any) {
    console.error('❌ Webhook error:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook failed' },
      { status: 500 }
    );
  }
}
