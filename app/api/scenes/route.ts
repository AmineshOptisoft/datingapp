import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Scene from "@/models/Scene";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import ReelView from "@/models/ReelView";
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

    // Support fetching a specific user's scenes via query param, default to logged-in user
    const { searchParams } = new URL(request.url);
    const queryUserId = searchParams.get("userId");
    const targetUserId = queryUserId || decoded.userId;

    // Get all scenes for this user, sorted by newest first
    const scenes = await Scene.find({ userId: targetUserId })
      .sort({ createdAt: -1 })
      .lean();

    // Enrich scenes with their reel's stats and public status
    const sceneIds = scenes.map((s: any) => s._id.toString());
    const validReelIdsOnScene = scenes.filter((s: any) => s.reelId).map((s: any) => s.reelId);

    const reels = await Reel.find({
      $or: [
        { sceneId: { $in: sceneIds } },
        { _id: { $in: validReelIdsOnScene } }
      ]
    }).select("_id sceneId isPublic comments").lean();

    const matchedReelIds = reels.map((r: any) => r._id);

    let reelStatsMap: Record<string, any> = {};
    if (matchedReelIds.length > 0) {
      const [viewsData, likesData] = await Promise.all([
        ReelView.aggregate([
          { $match: { reelId: { $in: matchedReelIds } } },
          { $group: { _id: "$reelId", count: { $sum: 1 } } }
        ]),
        ReelLike.aggregate([
          { $match: { reelId: { $in: matchedReelIds } } },
          { $group: { _id: "$reelId", count: { $sum: 1 } } }
        ]),
      ]);

      const viewCounts: Record<string, number> = {};
      viewsData.forEach((d: any) => viewCounts[d._id.toString()] = d.count);

      const likeCounts: Record<string, number> = {};
      likesData.forEach((d: any) => likeCounts[d._id.toString()] = d.count);

      reels.forEach((r: any) => {
        const _idStr = r._id.toString();
        const statsObj = {
          isPublic: r.isPublic,
          commentsCount: r.comments?.length || 0,
          viewsCount: viewCounts[_idStr] || 0,
          likesCount: likeCounts[_idStr] || 0,
        };
        if (r.sceneId) reelStatsMap[`scene_${r.sceneId.toString()}`] = statsObj;
        reelStatsMap[`reel_${_idStr}`] = statsObj;
      });
    }

    const enrichedScenes = scenes.map((scene: any) => {
      const sceneIdStr = scene._id.toString();
      const reelIdStr = scene.reelId?.toString();
      const reelStats = reelStatsMap[`scene_${sceneIdStr}`] || (reelIdStr ? reelStatsMap[`reel_${reelIdStr}`] : null);
      
      return {
        ...scene,
        isReelPublic: reelStats?.isPublic ?? false,
        reelViewsCount: reelStats?.viewsCount ?? 0,
        reelLikesCount: reelStats?.likesCount ?? 0,
        reelCommentsCount: reelStats?.commentsCount ?? 0,
      };
    });

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
