import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Block from "@/models/Block";
import User from "@/models/User";
import dbConnect from "@/lib/db";

// GET /api/users/blocked - Fetch all users blocked by the current user
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const currentUserId = decoded.userId;

    // Find all blocks where the current user is the blocker
    const blocks = await Block.find({ blockerId: currentUserId })
      .sort({ createdAt: -1 })
      .lean();

    if (blocks.length === 0) {
      return NextResponse.json({ success: true, blockedUsers: [] });
    }

    // Get all blocked user IDs
    const blockedUserIds = blocks.map((b: any) => b.blockedId);

    // Fetch user details for all blocked users
    const blockedUsers = await User.find({ _id: { $in: blockedUserIds } })
      .select("_id name username avatar")
      .lean();

    // Merge block timestamps with user details
    const result = blockedUsers.map((user: any) => {
      const block = blocks.find((b: any) => b.blockedId.toString() === user._id.toString());
      return {
        _id: user._id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        blockedAt: block?.createdAt || null,
      };
    });

    return NextResponse.json({ success: true, blockedUsers: result });
  } catch (error: any) {
    console.error("Error fetching blocked users:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
