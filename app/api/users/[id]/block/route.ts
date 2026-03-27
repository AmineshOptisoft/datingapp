import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import Block from "@/models/Block";
import Follow from "@/models/Follow";
import dbConnect from "@/lib/db";

// POST /api/users/[id]/block - Block a user
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const targetUserId = params.id;

    if (currentUserId === targetUserId) {
      return NextResponse.json({ success: false, error: "You cannot block yourself" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if already blocked
    const existingBlock = await Block.findOne({ blockerId: currentUserId, blockedId: targetUserId });
    
    if (!existingBlock) {
      await Block.create({ blockerId: currentUserId, blockedId: targetUserId });

      // When blocking, also remove follow relationships if they exist
      const deleteFollow1 = Follow.deleteOne({ followerId: currentUserId, followingId: targetUserId });
      const deleteFollow2 = Follow.deleteOne({ followerId: targetUserId, followingId: currentUserId });

      const [res1, res2] = await Promise.all([deleteFollow1, deleteFollow2]);

      // If followers were deleted, update counts (we'd need accurate counts so just decrement if deleted)
      if (res1.deletedCount > 0) {
        await User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } });
        await User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } });
      }
      if (res2.deletedCount > 0) {
        await User.findByIdAndUpdate(currentUserId, { $inc: { followersCount: -1 } });
        await User.findByIdAndUpdate(targetUserId, { $inc: { followingCount: -1 } });
      }

      return NextResponse.json({ 
        success: true, 
        message: "Blocked successfully"
      }, { status: 201 });
    } else {
      return NextResponse.json({ success: false, error: "Already blocked" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("❌ Error blocking user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id]/block - Unblock a user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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
    const targetUserId = params.id;

    const deleteResult = await Block.deleteOne({
      blockerId: currentUserId,
      blockedId: targetUserId,
    });

    if (deleteResult.deletedCount > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Unblocked successfully"
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: true, message: "Not blocked" }, { status: 200 });
    }
  } catch (error: any) {
    console.error("❌ Error unblocking user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
