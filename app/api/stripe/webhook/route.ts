import { NextRequest, NextResponse } from "next/server";
import { stripe } from "@/lib/stripe";
import {
    handleCheckoutCompleted,
    handleSubscriptionCreated,
    handleSubscriptionUpdated,
    handleSubscriptionDeleted,
    handlePaymentIntentSucceeded,
} from "@/lib/stripe-utils";
import dbConnect from "@/lib/db";
import Stripe from "stripe";

// WARNING: Webhook signature verification is disabled for easier testing
// For production, you should enable signature verification by:
// 1. Setting STRIPE_WEBHOOK_SECRET in your .env.local
// 2. Uncommenting the signature verification code below

export async function POST(request: NextRequest) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("🔔 WEBHOOK RECEIVED!");
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    
    try {
        await dbConnect();

        const body = await request.text();
        console.log("📦 Webhook body received, length:", body.length);

        // Parse the event directly without signature verification
        let event: Stripe.Event;
        try {
            event = JSON.parse(body) as Stripe.Event;
            console.log("✅ Event parsed successfully, type:", event.type);
        } catch (err: any) {
            console.error("❌ Failed to parse webhook body:", err.message);
            return NextResponse.json(
                { success: false, message: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }

        /* PRODUCTION: Uncomment this block to enable signature verification
        const signature = request.headers.get("stripe-signature");

        if (!signature) {
            console.error("❌ No Stripe signature found");
            return NextResponse.json(
                { success: false, message: "No signature" },
                { status: 400 }
            );
        }

        if (!process.env.STRIPE_WEBHOOK_SECRET) {
            console.error("❌ STRIPE_WEBHOOK_SECRET not configured");
            return NextResponse.json(
                { success: false, message: "Webhook secret not configured" },
                { status: 500 }
            );
        }

        try {
            event = stripe.webhooks.constructEvent(
                body,
                signature,
                process.env.STRIPE_WEBHOOK_SECRET
            );
        } catch (err: any) {
            console.error("❌ Webhook signature verification failed:", err.message);
            return NextResponse.json(
                { success: false, message: `Webhook Error: ${err.message}` },
                { status: 400 }
            );
        }
        */

        console.log(`✅ Received webhook event: ${event.type}`);

        // Handle different event types
        switch (event.type) {
            case "checkout.session.completed":
                const session = event.data.object as Stripe.Checkout.Session;
                await handleCheckoutCompleted(session);
                break;

            case "customer.subscription.created":
                const subscriptionCreated = event.data.object as Stripe.Subscription;
                console.log("✅ Subscription created tori mai ka wala:", subscriptionCreated);
                await handleSubscriptionCreated(subscriptionCreated);
                break;

            case "customer.subscription.updated":
                const subscriptionUpdated = event.data.object as Stripe.Subscription;
                // console.log("✅ Subscription updated tori mai ka wala:", subscriptionUpdated);
                await handleSubscriptionUpdated(subscriptionUpdated);
                break;

            case "customer.subscription.deleted":
                const subscriptionDeleted = event.data.object as Stripe.Subscription;
                await handleSubscriptionDeleted(subscriptionDeleted);
                break;

            case "invoice.payment_succeeded":
                console.log("✅ Payment succeeded for invoice:", event.data.object.id);
                break;

            case "invoice.payment_failed":
                console.log("❌ Payment failed for invoice:", event.data.object.id);
                break;

            case "payment_intent.succeeded":
                const paymentIntent = event.data.object as Stripe.PaymentIntent;
                await handlePaymentIntentSucceeded(paymentIntent);
                break;

            default:
                console.log(`Unhandled event type: ${event.type}`);
        }

        return NextResponse.json({ success: true, received: true });
    } catch (error) {
        console.error("❌ Error processing Stripe webhook:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process Stripe webhook" },
            { status: 500 }
        );
    }
}

