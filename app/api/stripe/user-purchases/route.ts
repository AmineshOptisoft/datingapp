import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserSubscription from "@/models/UserSubscriptions";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
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

        // Get all user's active subscriptions
        const subscriptions = await UserSubscription.find({
            userId: decoded.userId,
            status: { $in: ['active', 'trialing'] }
        })
            .populate('aiProfileId')
            .sort({ createdAt: -1 });

        // Get list of purchased AI profile IDs
        const purchasedAIProfiles = subscriptions.map(sub => ({
            aiProfileId: sub.aiProfileId,
            planType: sub.planType,
            status: sub.status,
            subscriptionId: sub.stripeSubscriptionId,
            currentPeriodEnd: sub.currentPeriodEnd,
            cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
            purchasedAt: sub.createdAt,
        }));

        return NextResponse.json({
            success: true,
            purchases: purchasedAIProfiles,
            totalPurchases: purchasedAIProfiles.length,
        });
    } catch (error: any) {
        console.error("❌ Error fetching user purchases:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to fetch user purchases"
            },
            { status: 500 }
        );
    }
}
