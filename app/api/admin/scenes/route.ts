import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Scene from "@/models/Scene";

// POST /api/admin/scenes — Create a scene for any user/character
export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const body = await request.json();
    const { userId, characterId, sceneTitle, sceneDescription, mediaType, mediaUrl } = body;

    if (!userId || !sceneTitle || !sceneDescription || !mediaType || !mediaUrl) {
      return NextResponse.json(
        { success: false, error: "userId, sceneTitle, sceneDescription, mediaType, and mediaUrl are required" },
        { status: 400 }
      );
    }

    if (!["image", "video"].includes(mediaType)) {
      return NextResponse.json(
        { success: false, error: "mediaType must be 'image' or 'video'" },
        { status: 400 }
      );
    }

    const scene = await Scene.create({
      userId,
      characterId: characterId || null,
      sceneTitle,
      sceneDescription,
      mediaType,
      mediaUrl,
    });

    console.log(`🛡️ Admin created scene: ${scene._id} for user ${userId}`);

    return NextResponse.json({ success: true, scene }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Admin create scene error:", error);
    return NextResponse.json({ success: false, error: "Failed to create scene" }, { status: 500 });
  }
}
