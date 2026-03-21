import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
import AIProfile from "@/models/AIProfile";

// POST - Increment interaction count for a character or AI profile
// Called when a user starts a chat with this character/profile
// Body: { userId: string }
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
    const aiProfile = await AIProfile.findById(id).select("interactions interactedBy").lean();

    if (aiProfile) {
      const alreadyInteracted = (aiProfile as any).interactedBy?.includes(userId);

      if (alreadyInteracted) {
        return NextResponse.json({
          success: true,
          interactions: (aiProfile as any).interactions ?? 0,
        });
      }

      const updatedProfile = await AIProfile.findByIdAndUpdate(
        id,
        {
          $addToSet: { interactedBy: userId },
          $inc: { interactions: 1 },
        },
        { new: true, select: { interactions: 1 } }
      ).lean();

      if (!updatedProfile) {
        return NextResponse.json(
          { success: false, message: "Failed to interact" },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        interactions: (updatedProfile as any)?.interactions ?? 0,
      });
    }

    // ── Fallback: try User.characters (subdocument scan) ──
    const ownerUser = await User.findOne({ "characters._id": id });

    if (!ownerUser) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const character = ownerUser.characters?.find(
      (c: any) => c._id.toString() === id
    );

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    const alreadyInteracted = (character as any).interactedBy?.includes(userId);

    if (alreadyInteracted) {
      return NextResponse.json({
        success: true,
        interactions: (character as any).interactions ?? 0,
      });
    }

    const updatedUser = await User.findOneAndUpdate(
      { "characters._id": id },
      { 
        $addToSet: { "characters.$.interactedBy": userId },
        $inc: { "characters.$.interactions": 1 } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to interact" },
        { status: 500 }
      );
    }

    const updatedChar = updatedUser.characters?.find(
      (c: any) => c._id.toString() === id
    );

    return NextResponse.json({
      success: true,
      interactions: (updatedChar as any)?.interactions ?? 0,
    });
  } catch (error) {
    console.error("Interaction count error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

