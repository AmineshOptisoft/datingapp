import { NextRequest, NextResponse } from "next/server";


export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

    } catch (error) {
        console.error("❌ Error processing Stripe webhook:", error);
        return NextResponse.json(
            { success: false, message: "Failed to process Stripe webhook" },
            { status: 500 }
        );
    }

}
