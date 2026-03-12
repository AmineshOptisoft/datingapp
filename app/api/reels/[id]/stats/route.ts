import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import ReelView from "@/models/ReelView";
import dbConnect from "@/lib/db";

// GET /api/reels/[id]/stats — lightweight endpoint for real-time count polling
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentUserId: string | null = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) currentUserId = decoded.userId;
    }

    // Fetch counts in parallel for speed
    const [reel, likesCount, viewsCount, isLikedByUser] = await Promise.all([
      Reel.findById(params.id).select("comments").lean() as any,
      ReelLike.countDocuments({ reelId: params.id }),
      ReelView.countDocuments({ reelId: params.id }),
      currentUserId
        ? ReelLike.exists({ reelId: params.id, userId: currentUserId })
        : Promise.resolve(null),
    ]);

    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      likesCount,
      viewsCount,
      commentsCount: reel.comments?.length || 0,
      isLiked: !!isLikedByUser,
    });
  } catch (error: any) {
    console.error("❌ Error fetching reel stats:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
