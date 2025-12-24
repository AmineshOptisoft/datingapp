import { NextRequest, NextResponse } from "next/server";
import { createCheckoutSession } from "@/lib/stripe-utils";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

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

        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json(
                { success: false, message: "User not found" },
                { status: 404 }
            );
        }

        const body = await request.json();
        const { aiProfileId, planType } = body;

        // Validate input
        if (!aiProfileId || !planType) {
            return NextResponse.json(
                { success: false, message: "Missing required fields: aiProfileId and planType" },
                { status: 400 }
            );
        }

        if (!['monthly', 'annual', 'lifetime'].includes(planType)) {
            return NextResponse.json(
                { success: false, message: "Invalid plan type. Must be 'monthly', 'annual', or 'lifetime'" },
                { status: 400 }
            );
        }

        // Create checkout session
        const checkoutSession = await createCheckoutSession(
            user._id.toString(),
            user.email,
            user.name,
            aiProfileId,
            planType
        );

        return NextResponse.json({
            success: true,
            sessionId: checkoutSession.id,
            url: checkoutSession.url,
        });
    } catch (error: any) {
        console.error("❌ Error creating checkout session:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to create checkout session"
            },
            { status: 500 }
        );
    }
}
