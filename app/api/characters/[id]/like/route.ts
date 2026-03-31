import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import AIProfile from "@/models/AIProfile";
import { verifyToken } from "@/lib/auth";

// Helper: extract and verify JWT from cookie or Bearer header
function authenticate(request: NextRequest) {
  let token = request.cookies.get("token")?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }
  if (!token) return null;
  return verifyToken(token);
}

// POST - Like or Unlike a character or AI profile
// Body: { userId: string }
// Uses atomic conditional updates to prevent race conditions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Verify authentication
    const decoded = authenticate(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No valid token" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = params;
    const userId = decoded.userId;

    // ── Try AIProfile FIRST (fast _id index lookup) ──
    // ATOMIC unlike: only matches if userId IS in likedBy
    const aiUnlike = await AIProfile.findOneAndUpdate(
      { _id: id, likedBy: userId },
      {
        $pull: { likedBy: userId },
        $inc: { likes: -1 },
      },
      { new: true, select: { likes: 1 } }
    ).lean();

    if (aiUnlike) {
      return NextResponse.json({
        success: true,
        liked: false,
        likes: (aiUnlike as any)?.likes ?? 0,
      });
    }

    // ATOMIC like: only matches if userId is NOT in likedBy
    const aiLike = await AIProfile.findOneAndUpdate(
      { _id: id, likedBy: { $ne: userId } },
      {
        $push: { likedBy: userId },
        $inc: { likes: 1 },
      },
      { new: true, select: { likes: 1 } }
    ).lean();

    if (aiLike) {
      return NextResponse.json({
        success: true,
        liked: true,
        likes: (aiLike as any)?.likes ?? 0,
      });
    }

    // ── Fallback: try User.characters (subdocument scan) ──
    // ATOMIC unlike
    const charUnlike = await User.findOneAndUpdate(
      {
        "characters._id": id,
        "characters.likedBy": userId,
      },
      {
        $pull: { "characters.$.likedBy": userId },
        $inc: { "characters.$.likes": -1 },
      },
      { new: true, select: { "characters._id": 1, "characters.likes": 1 } }
    ).lean();

    if (charUnlike) {
      const updatedChar = (charUnlike as any).characters?.find(
        (c: any) => c._id.toString() === id
      );
      return NextResponse.json({
        success: true,
        liked: false,
        likes: (updatedChar as any)?.likes ?? 0,
      });
    }

    // ATOMIC like
    const charLike = await User.findOneAndUpdate(
      {
        "characters._id": id,
        "characters.likedBy": { $ne: userId },
      },
      {
        $push: { "characters.$.likedBy": userId },
        $inc: { "characters.$.likes": 1 },
      },
      { new: true, select: { "characters._id": 1, "characters.likes": 1 } }
    ).lean();

    if (charLike) {
      const updatedChar = (charLike as any).characters?.find(
        (c: any) => c._id.toString() === id
      );
      return NextResponse.json({
        success: true,
        liked: true,
        likes: (updatedChar as any)?.likes ?? 0,
      });
    }

    // Nothing matched — profile not found
    return NextResponse.json(
      { success: false, message: "Profile not found" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Like/Unlike error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}


