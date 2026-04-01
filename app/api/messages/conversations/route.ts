import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Message from "@/models/Message";
import User from "@/models/User";
import { verifyToken } from "@/lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
  try {
    // Support both Cookie and Bearer token
    let token = request.cookies.get("token")?.value;
    
    if (!token) {
      const authHeader = request.headers.get("authorization");
      token = authHeader?.replace("Bearer ", "");
    }

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No token provided" },
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

    await dbConnect();

    // Update user's last activity
    await User.findByIdAndUpdate(decoded.userId, { 
      lastActiveAt: new Date() 
    });

    // Get unique user IDs from messages
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [{ sender: decoded.userId }, { receiver: decoded.userId }],
        },
      },
      {
        $sort: { createdAt: -1 },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ["$sender", decoded.userId] },
              "$receiver",
              "$sender",
            ],
          },
          lastMessage: { $first: "$message" },
          lastMessageTime: { $first: "$createdAt" },
          unreadCount: {
            $sum: {
              $cond: [
                {
                  $and: [
                    { $eq: ["$receiver", decoded.userId] },
                    { $eq: ["$read", false] },
                  ],
                },
                1,
                0,
              ],
            },
          },
        },
      },
    ]);

    // Populate user details
    const conversationsWithUsers = await Promise.all(
      conversations.map(async (conv) => {
        let user = null;
        let isAI = false;

        // Check if ID is a valid MongoDB ObjectId (for Users)
        if (mongoose.Types.ObjectId.isValid(conv._id)) {
          user = await User.findById(conv._id).select("name email avatar");
        } 
        
        // If not a valid ObjectId or User not found, treat as AI Profile
        if (!user) {
          isAI = true;
          // In a real scenario, you might fetch from an AIProfile model here
          // For now, we'll format it as an AI participant
          user = {
            _id: conv._id,
            name: conv._id.startsWith("girl-") || conv._id.startsWith("boy-") 
              ? `AI Companion (${conv._id})` 
              : "Unknown User",
            email: "ai@companion.com",
            avatar: "/images/ai-avatar-placeholder.png" // Placeholder
          };
        }

        return {
          userId: conv._id,
          user,
          lastMessage: conv.lastMessage,
          lastMessageTime: conv.lastMessageTime,
          unreadCount: conv.unreadCount,
          isAI
        };
      })
    );

    return NextResponse.json(
      {
        success: true,
        data: conversationsWithUsers,
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Error fetching conversations:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}
