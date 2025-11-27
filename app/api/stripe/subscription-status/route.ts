import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserSubscription from "@/models/UserSubscriptions";
import AIProfile from "@/models/AIProfile";
import dbConnect from "@/lib/db";

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

        // Get aiProfileId from query params (optional)
        const { searchParams } = new URL(request.url);
        const aiProfileId = searchParams.get("aiProfileId");

        let query: any = {
            userId: decoded.userId,
            status: { $in: ['active', 'trialing'] }
        };

        if (aiProfileId) {
            query.aiProfileId = aiProfileId;
        }

        // Get active subscriptions
        const subscriptions = await UserSubscription.find(query)
            .populate('aiProfileId')
            .sort({ createdAt: -1 });

        return NextResponse.json({
            success: true,
            subscriptions: subscriptions.map(sub => ({
                id: sub._id,
                aiProfileId: sub.aiProfileId,
                planType: sub.planType,
                status: sub.status,
                currentPeriodStart: sub.currentPeriodStart,
                currentPeriodEnd: sub.currentPeriodEnd,
                cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                amount: sub.amount,
                currency: sub.currency,
                createdAt: sub.createdAt,
            })),
        });
    } catch (error: any) {
        console.error("❌ Error fetching subscription status:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to fetch subscription status"
            },
            { status: 500 }
        );
    }
}
