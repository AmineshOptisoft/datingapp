import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
    handleCheckoutCompleted,
    handleSubscriptionCreated,
} from "@/lib/stripe-utils";
import dbConnect from "@/lib/db";
import UserSubscription from '@/models/UserSubscriptions';

export async function POST(request: NextRequest) {
    try {
        await dbConnect();
        
        const body = await request.json();
        const { sessionId } = body;

        if (!sessionId) {
            return NextResponse.json({ success: false, message: "Missing sessionId" }, { status: 400 });
        }

        console.log(`🔍 Manually verifying session: ${sessionId}`);

        // Fetch session from Stripe
        const session = await stripe.checkout.sessions.retrieve(sessionId, {
            expand: ['line_items', 'subscription']
        });

        if (session.payment_status !== 'paid') {
            return NextResponse.json({ success: false, message: "Session not paid yet" });
        }

        // Process checkout completion
        try {
            await handleCheckoutCompleted(session);
        } catch (e) {
            console.error("Error in handleCheckoutCompleted during verify:", e);
        }

        // If it's a subscription, manually process the subscription created logic
        if (session.subscription && typeof session.subscription !== 'string') {
            const subscription = session.subscription as any;
            
            // Wait briefly to allow webhook to process first if it's working
            await new Promise(resolve => setTimeout(resolve, 500));

            // Check if subscription already exists in DB
            const existing = await UserSubscription.findOne({ stripeSubscriptionId: subscription.id });
            
            if (!existing) {
                console.log(`⚠️ Webhook missed subscription ${subscription.id}, manually creating DB record...`);
                
                // Copy metadata from session to subscription if missing
                if (!subscription.metadata?.userId && session.metadata?.userId) {
                    subscription.metadata = { ...session.metadata };
                }

                await handleSubscriptionCreated(subscription);
            }
        }

        return NextResponse.json({ success: true, message: "Session verified" });
    } catch (error: any) {
        console.error("❌ Error verifying checkout session:", error);
        return NextResponse.json(
            { success: false, message: error.message || "Failed to verify checkout session" },
            { status: 500 }
        );
    }
}
