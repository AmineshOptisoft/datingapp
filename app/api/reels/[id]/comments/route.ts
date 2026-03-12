import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import dbConnect from "@/lib/db";

// GET /api/reels/[id]/comments — fetch all comments for a reel
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const reel = await Reel.findById(params.id).select("comments").lean() as any;
    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    // Sort oldest first
    const comments = (reel.comments || []).sort(
      (a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );

    return NextResponse.json({ success: true, comments });
  } catch (error: any) {
    console.error("❌ Error fetching comments:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch comments" }, { status: 500 });
  }
}

// POST /api/reels/[id]/comments — add a comment
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const { text } = body;

    if (!text || text.trim().length === 0) {
      return NextResponse.json({ success: false, error: "Comment text is required" }, { status: 400 });
    }
    if (text.length > 500) {
      return NextResponse.json({ success: false, error: "Comment too long (max 500 chars)" }, { status: 400 });
    }

    // Get user info for the comment
    const User = (await import("@/models/User")).default;
    const user = await User.findById(decoded.userId).select("name username avatar").lean() as any;
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const newComment = {
      userId: decoded.userId,
      username: user.username || user.name || "User",
      avatar: user.avatar || null,
      text: text.trim(),
    };

    const reel = await Reel.findByIdAndUpdate(
      params.id,
      { $push: { comments: newComment } },
      { new: true }
    );

    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    const addedComment = reel.comments[reel.comments.length - 1];

    return NextResponse.json({
      success: true,
      comment: addedComment,
      commentsCount: reel.comments.length,
    }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error posting comment:", error);
    return NextResponse.json({ success: false, error: "Failed to post comment" }, { status: 500 });
  }
}
