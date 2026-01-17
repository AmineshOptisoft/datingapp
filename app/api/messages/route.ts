import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import { verifyToken } from "@/lib/auth";

export const dynamic = "force-dynamic";
export const revalidate = 0;

// Get conversation between two users
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const otherUserId = searchParams.get("userId");

    if (!otherUserId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const messages = await Message.find({
      $or: [
        { sender: decoded.userId, receiver: otherUserId },
        { sender: otherUserId, receiver: decoded.userId },
      ],
    })
      .sort({ createdAt: 1 })
      .limit(100);

    return NextResponse.json(
      {
        success: true,
        data: messages,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error fetching messages:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
}
