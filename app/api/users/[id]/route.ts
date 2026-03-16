import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Scene from "@/models/Scene";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const userId = params.id;

    // Fetch user public info (no password, no email, no sensitive fields)
    const user = await User.findById(userId)
      .select("_id name username avatar bio characters")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const typedUser = user as any;

    // Only return visible characters (can filter by visibility if needed)
    const characters = (typedUser.characters || []).map((c: any) => ({
      _id: c._id,
      characterName: c.characterName,
      characterImage: c.characterImage,
      characterAge: c.characterAge,
      characterGender: c.characterGender,
      language: c.language,
      tags: c.tags,
      description: c.description,
      visibility: c.visibility,
    }));

    // Fetch public scenes for this user
    const scenes = await Scene.find({ userId, isPublishedAsReel: true })
      .select("_id sceneTitle sceneDescription mediaUrl mediaType createdAt")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      success: true,
      user: {
        _id: typedUser._id,
        name: typedUser.name,
        username: typedUser.username,
        avatar: typedUser.avatar,
        bio: typedUser.bio,
      },
      characters,
      scenes,
    });
  } catch (error: any) {
    console.error("Error fetching public user profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
