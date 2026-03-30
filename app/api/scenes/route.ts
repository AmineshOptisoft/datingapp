import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Scene from "@/models/Scene";
import User from "@/models/User";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import ReelView from "@/models/ReelView";
import dbConnect from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const queryUserId  = searchParams.get("userId");
    const characterId  = searchParams.get("characterId");

    // ── Auth ──────────────────────────────────────────────────────────────
    // Public access is allowed when fetching scenes for a specific character.
    // A valid token is required only when fetching a user's own scene list.
    const authHeader = request.headers.get("authorization");
    const token      = authHeader?.replace("Bearer ", "") ?? null;
    let decoded: any = null;

    if (token) {
      decoded = verifyToken(token);
    }

    if (!characterId && !decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      );
    }
    // ──────────────────────────────────────────────────────────────────────

    await dbConnect();

    // Build the Mongoose query
    const sceneQuery: Record<string, any> = {};
    if (characterId) {
      // Public: return all scenes tagged to that character
      sceneQuery.characterId = characterId;
    } else {
      // Private: return scenes owned by the requesting user
      sceneQuery.userId = queryUserId || decoded.userId;
    }

    // Get scenes sorted newest-first
    const scenes = await Scene.find(sceneQuery)
      .populate("userId", "name avatar")
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
      
      const userObj = scene.userId;
      const userId = userObj?._id || userObj;
      const userName = userObj?.name || "Unknown User";
      const userAvatar = userObj?.avatar || null;

      return {
        ...scene,
        userId,
        userName,
        userAvatar,
        isReelPublic: reelStats?.isPublic ?? false,
        reelViewsCount: reelStats?.viewsCount ?? 0,
        reelLikesCount: reelStats?.likesCount ?? 0,
        reelCommentsCount: reelStats?.commentsCount ?? 0,
      };
    });

    console.log(`📚 Fetched ${scenes.length} scenes — characterId: ${characterId ?? 'n/a'}, userId: ${decoded?.userId ?? 'n/a'}`);

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
