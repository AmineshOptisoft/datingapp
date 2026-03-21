import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import AIProfile from "@/models/AIProfile";

// POST - Like or Unlike a character or AI profile
// Body: { userId: string }
// Uses atomic conditional updates to prevent race conditions
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let body: { userId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

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


