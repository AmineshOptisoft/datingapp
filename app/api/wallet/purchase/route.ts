import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { verifyToken } from '@/lib/auth';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is not set in environment variables');
}

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2025-12-15.clover',
});

// Coin package definitions
const PACKAGES = {
  starter: {
    coins: 300,
    price: 1000, // $10 in cents
    name: 'Starter Package',
  },
  popular: {
    coins: 840,
    price: 2500, // $25 in cents
    name: 'Popular Package',
  },
  premium: {
    coins: 2000,
    price: 5000, // $50 in cents
    name: 'Premium Package',
  },
};

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get('authorization');
    const token = authHeader?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const { packageId } = await request.json();

    // Validate package
    if (!packageId || !PACKAGES[packageId as keyof typeof PACKAGES]) {
      return NextResponse.json(
        { success: false, error: 'Invalid package' },
        { status: 400 }
      );
    }

    const selectedPackage = PACKAGES[packageId as keyof typeof PACKAGES];

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: selectedPackage.name,
              description: `${selectedPackage.coins} coins for AI art generation`,
            },
            unit_amount: selectedPackage.price,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=success`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/profile?payment=cancelled`,
      metadata: {
        userId: decoded.userId,
        packageId,
        coins: selectedPackage.coins.toString(),
      },
    });

    return NextResponse.json({
      success: true,
      checkoutUrl: session.url,
      sessionId: session.id,
    });

  } catch (error: any) {
    console.error('❌ Error creating checkout session:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    );
  }
}
