import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Scene from "@/models/Scene";
import Reel from "@/models/Reel";
import dbConnect from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Invalid token" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Get all scenes for this user, sorted by newest first
    const scenes = await Scene.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich scenes with their reel's isPublic status
    const reelIds = scenes
      .filter((s: any) => s.reelId)
      .map((s: any) => s.reelId);

    let reelStatusMap: Record<string, boolean> = {};
    if (reelIds.length > 0) {
      const reels = await Reel.find({ _id: { $in: reelIds } })
        .select("_id isPublic")
        .lean();
      reels.forEach((r: any) => {
        reelStatusMap[r._id.toString()] = r.isPublic;
      });
    }

    const enrichedScenes = scenes.map((scene: any) => ({
      ...scene,
      isReelPublic: scene.reelId ? (reelStatusMap[scene.reelId] ?? false) : false,
    }));

    console.log(`📚 Fetched ${scenes.length} scenes for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      scenes: enrichedScenes,
      count: scenes.length
    });

  } catch (error: any) {
    console.error("❌ Error fetching scenes:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch scenes" },
      { status: 500 }
    );
  }
}
