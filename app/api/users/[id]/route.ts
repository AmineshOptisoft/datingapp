import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";
import Scene from "@/models/Scene";
import Follow from "@/models/Follow";
import Block from "@/models/Block";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const userId = params.id;

    const mongoose = require("mongoose");
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { success: false, error: "Invalid User ID format" },
        { status: 400 }
      );
    }

    // Fetch user public info (no password, no email, no sensitive fields)
    const user = await User.findById(userId)
      .select("_id name username avatar bio characters followersCount followingCount")
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
      .select("_id sceneTitle sceneDescription mediaUrl mediaType createdAt reelId")
      .sort({ createdAt: -1 })
      .lean();

    // Fetch view counts for these scenes if they have reelIds
    const sceneIds = scenes.map((s: any) => s._id.toString());
    const validReelIdsOnScene = scenes.map((s: any) => s.reelId).filter(Boolean);

    // Fetch reels associated with these scenes
    const reelsReq = await dbConnect().then(async () => {
      const Reel = require('@/models/Reel').default || require('@/models/Reel');
      return Reel.find({
        $or: [
          { sceneId: { $in: sceneIds } },
          { _id: { $in: validReelIdsOnScene } }
        ]
      }).select("_id sceneId comments").lean();
    });

    const matchedReelIds = reelsReq.map((r: any) => r._id);
    const viewCounts: Record<string, number> = {};
    const likeCounts: Record<string, number> = {};

    if (matchedReelIds.length > 0) {
      const [viewsData, likesData] = await dbConnect().then(async () => {
        const ReelView = require('@/models/ReelView').default || require('@/models/ReelView');
        const ReelLike = require('@/models/ReelLike').default || require('@/models/ReelLike');
        return Promise.all([
          ReelView.aggregate([
            { $match: { reelId: { $in: matchedReelIds } } },
            { $group: { _id: "$reelId", count: { $sum: 1 } } }
          ]),
          ReelLike.aggregate([
            { $match: { reelId: { $in: matchedReelIds } } },
            { $group: { _id: "$reelId", count: { $sum: 1 } } }
          ])
        ]);
      });

      viewsData.forEach((d: any) => viewCounts[d._id.toString()] = d.count);
      likesData.forEach((d: any) => likeCounts[d._id.toString()] = d.count);
    }

    // Create a map of sceneId -> reel -> stats
    const reelStatsMap: Record<string, { views: number, likes: number, comments: number }> = {};
    reelsReq.forEach((r: any) => {
      const views = viewCounts[r._id.toString()] || 0;
      const likes = likeCounts[r._id.toString()] || 0;
      const commentsCount = r.comments?.length || 0;
      const stats = { views, likes, comments: commentsCount };

      if (r.sceneId) reelStatsMap[`scene_${r.sceneId.toString()}`] = stats;
      reelStatsMap[`reel_${r._id.toString()}`] = stats;
    });

    const enrichedScenes = scenes.map((scene: any) => {
      const sceneIdStr = scene._id.toString();
      const reelIdStr = scene.reelId?.toString();
      const stats = reelStatsMap[`scene_${sceneIdStr}`] ?? (reelIdStr ? reelStatsMap[`reel_${reelIdStr}`] : null);
      
      return {
        ...scene,
        reelViewsCount: stats?.views || 0,
        reelLikesCount: stats?.likes || 0,
        reelCommentsCount: stats?.comments || 0,
      };
    });

    // Calculate total interactions across all characters
    const totalInteractions = (typedUser.characters || []).reduce(
      (sum: number, c: any) => sum + (c.interactions || 0),
      0
    );

    const responseData = {
      success: true,
      user: {
        _id: typedUser._id,
        name: typedUser.name,
        username: typedUser.username,
        avatar: typedUser.avatar,
        bio: typedUser.bio,
        followersCount: typedUser.followersCount || 0,
        followingCount: typedUser.followingCount || 0,
        totalInteractions,
      },
      isFollowing: false, // We will calculate this below
      characters,
      scenes: enrichedScenes,
      isBlocked: false,
    };

    // Check if the current user is following this profile
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (token) {
      const decoded = verifyToken(token);
      if (decoded && decoded.userId) {
        const [followDoc, blockDoc] = await Promise.all([
          Follow.findOne({
            followerId: decoded.userId,
            followingId: userId,
          }),
          Block.findOne({
            $or: [
              { blockerId: decoded.userId, blockedId: userId },
              { blockerId: userId, blockedId: decoded.userId }
            ]
          }),
        ]);
        responseData.isFollowing = !!followDoc;
        responseData.isBlocked = blockDoc ? blockDoc.blockerId.toString() === decoded.userId : false;
        
        if (blockDoc) {
          responseData.characters = [];
          responseData.scenes = [];
        }
      }
    }

    return NextResponse.json(responseData);
  } catch (error: any) {
    console.error("Error fetching public user profile:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
