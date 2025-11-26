import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserSubscription from "@/models/UserSubscriptions";
import { stripe } from "@/lib/stripe";
import dbConnect from "@/lib/db";

export async function POST(request: NextRequest) {
    try {
        await dbConnect();

        // Check authentication
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const { subscriptionId } = body;

        if (!subscriptionId) {
            return NextResponse.json(
                { success: false, message: "Missing subscriptionId" },
                { status: 400 }
            );
        }

        // Find the subscription and verify ownership
        const subscription = await UserSubscription.findOne({
            stripeSubscriptionId: subscriptionId,
            userId: decoded.userId,
        });

        if (!subscription) {
            return NextResponse.json(
                { success: false, message: "Subscription not found or unauthorized" },
                { status: 404 }
            );
        }

        // Don't cancel lifetime purchases
        if (subscription.planType === 'lifetime') {
            return NextResponse.json(
                { success: false, message: "Cannot cancel lifetime purchases" },
                { status: 400 }
            );
        }

        // Cancel subscription in Stripe
        await stripe.subscriptions.update(subscriptionId, {
            cancel_at_period_end: true,
        });

        // Update local database
        subscription.cancelAtPeriodEnd = true;
        await subscription.save();

        return NextResponse.json({
            success: true,
            message: "Subscription will be cancelled at the end of the billing period",
            subscription: {
                id: subscription._id,
                cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
                currentPeriodEnd: subscription.currentPeriodEnd,
            },
        });
    } catch (error: any) {
        console.error("❌ Error cancelling subscription:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to cancel subscription"
            },
            { status: 500 }
        );
    }
}
