import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import dbConnect from "@/lib/db";

// POST /api/reels/[id]/like — toggle like for current user
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

    const reel = await Reel.findById(params.id);
    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    const userId = decoded.userId;
    const existingLike = await ReelLike.findOne({ reelId: params.id, userId });

    let liked = false;
    if (existingLike) {
      // Unlike
      await ReelLike.deleteOne({ _id: existingLike._id });
    } else {
      // Like
      await ReelLike.create({ reelId: reel._id, userId });
      liked = true;
    }

    const likesCount = await ReelLike.countDocuments({ reelId: params.id });

    return NextResponse.json({
      success: true,
      liked,
      likesCount,
    });
  } catch (error: any) {
    console.error("❌ Error toggling like:", error);
    return NextResponse.json({ success: false, error: "Failed to toggle like" }, { status: 500 });
  }
}
