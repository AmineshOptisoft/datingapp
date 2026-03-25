import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import Follow from "@/models/Follow";
import dbConnect from "@/lib/db";
import mongoose from "mongoose";

// POST /api/users/[id]/follow - Follow a user
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
      return NextResponse.json({ success: false, error: "You cannot follow yourself" }, { status: 400 });
    }

    // Check if user exists
    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    // Check if already following
    const existingFollow = await Follow.findOne({ followerId: currentUserId, followingId: targetUserId });
    
    if (!existingFollow) {
      await Follow.create({ followerId: currentUserId, followingId: targetUserId });
      const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
        User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: 1 } }, { new: true }).select('followersCount'),
        User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: 1 } }, { new: true }).select('followingCount')
      ]);
      return NextResponse.json({ 
        success: true, 
        message: "Followed successfully",
        followersCount: updatedTargetUser?.followersCount || 0,
        followingCount: updatedCurrentUser?.followingCount || 0
      }, { status: 201 });
    } else {
      // Return success false so the frontend optimistic update correctly reverts if the UI was out of sync
      return NextResponse.json({ success: false, error: "Already following" }, { status: 400 });
    }

  } catch (error: any) {
    console.error("❌ Error following user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

// DELETE /api/users/[id]/follow - Unfollow a user
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

    const deleteResult = await Follow.deleteOne({
      followerId: currentUserId,
      followingId: targetUserId,
    });

    if (deleteResult.deletedCount > 0) {
      const [updatedTargetUser, updatedCurrentUser] = await Promise.all([
        User.findByIdAndUpdate(targetUserId, { $inc: { followersCount: -1 } }, { new: true }).select('followersCount'),
        User.findByIdAndUpdate(currentUserId, { $inc: { followingCount: -1 } }, { new: true }).select('followingCount')
      ]);
      return NextResponse.json({ 
        success: true, 
        message: "Unfollowed successfully",
        followersCount: updatedTargetUser?.followersCount || 0,
        followingCount: updatedCurrentUser?.followingCount || 0
      }, { status: 200 });
    } else {
      return NextResponse.json({ success: true, message: "Not following" }, { status: 200 });
    }
  } catch (error: any) {
    console.error("❌ Error unfollowing user:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
