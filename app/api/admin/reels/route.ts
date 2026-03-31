import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import Reel from "@/models/Reel";
import Scene from "@/models/Scene";

// POST /api/admin/reels — Publish a scene as reel for any user
export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const body = await request.json();
    const { userId, sceneId, mediaUrl, mediaType, caption } = body;

    if (!userId || !mediaUrl || !mediaType) {
      return NextResponse.json(
        { success: false, error: "userId, mediaUrl, and mediaType are required" },
        { status: 400 }
      );
    }

    // Create the reel for the specified user
    const reel = await Reel.create({
      userId,
      sceneId: sceneId || null,
      mediaUrl,
      mediaType,
      caption: caption || "",
      isPublic: true,
      views: [],
      likes: [],
      comments: [],
    });

    // Update the scene if sceneId provided
    if (sceneId) {
      await Scene.findByIdAndUpdate(sceneId, {
        isPublishedAsReel: true,
        reelId: reel._id.toString(),
      });
    }

    console.log(`🛡️ Admin created reel: ${reel._id} for user ${userId}`);

    return NextResponse.json({ success: true, reel }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Admin create reel error:", error);
    return NextResponse.json({ success: false, error: "Failed to create reel" }, { status: 500 });
  }
}
