import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import ReelView from "@/models/ReelView";
import Scene from "@/models/Scene";
import User from "@/models/User";
import dbConnect from "@/lib/db";

// GET /api/reels — fetch all public reels for the feed
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    let currentUserId: string | null = null;

    if (token) {
      const decoded = verifyToken(token);
      if (decoded) currentUserId = decoded.userId;
    }

    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get("cursor"); // Expected to be an ISO date string
    const limit = 10;

    let query: any = { isPublic: true };
    if (cursor) {
      query.createdAt = { $lt: new Date(cursor) };
    }

    // Fetch reels sorted newest first with limit
    const reels = await Reel.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .lean();

    const reelIds = reels.map((r: any) => r._id);

    // Fetch view counts, like counts, and user's likes in parallel
    const [viewsData, likesData, userLikesData] = await Promise.all([
      ReelView.aggregate([
        { $match: { reelId: { $in: reelIds } } },
        { $group: { _id: "$reelId", count: { $sum: 1 } } }
      ]),
      ReelLike.aggregate([
        { $match: { reelId: { $in: reelIds } } },
        { $group: { _id: "$reelId", count: { $sum: 1 } } }
      ]),
      currentUserId ? ReelLike.find({ reelId: { $in: reelIds }, userId: currentUserId }).lean() : Promise.resolve([])
    ]);

    const viewCounts: Record<string, number> = {};
    viewsData.forEach((d: any) => viewCounts[d._id.toString()] = d.count);

    const likeCounts: Record<string, number> = {};
    likesData.forEach((d: any) => likeCounts[d._id.toString()] = d.count);

    const userLikedSet = new Set(userLikesData.map((d: any) => d.reelId.toString()));

    // Attach poster info
    const userIds = [...new Set(reels.map((r: any) => r.userId.toString()))];
    const users = await User.find({ _id: { $in: userIds } })
      .select("_id name username avatar")
      .lean();
    const userMap: Record<string, any> = {};
    users.forEach((u: any) => { userMap[u._id.toString()] = u; });

    const enrichedReels = reels.map((reel: any) => {
      const poster = userMap[reel.userId.toString()] || {};
      const idStr = reel._id.toString();

      // Ensure we use legacy views/likes as a fallback during migration
      const viewsCount = viewCounts[idStr] !== undefined ? viewCounts[idStr] : (reel.views?.length || 0);
      const likesCount = likeCounts[idStr] !== undefined ? likeCounts[idStr] : (reel.likes?.length || 0);
      
      const isLiked = currentUserId ? userLikedSet.has(idStr) : false;

      return {
        _id: reel._id,
        mediaUrl: reel.mediaUrl,
        mediaType: reel.mediaType,
        caption: reel.caption,
        isPublic: reel.isPublic,
        likesCount,
        viewsCount,
        commentsCount: reel.comments?.length || 0,
        isLiked,
        poster: {
          _id: poster._id,
          name: poster.name,
          username: poster.username,
          avatar: poster.avatar,
        },
        createdAt: reel.createdAt,
      };
    });

    const nextCursor = reels.length === limit ? reels[reels.length - 1].createdAt : null;

    return NextResponse.json({ success: true, reels: enrichedReels, nextCursor });
  } catch (error: any) {
    console.error("❌ Error fetching reels:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch reels" }, { status: 500 });
  }
}

// POST /api/reels — publish a scene as a reel
export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const { sceneId, mediaUrl, mediaType, caption } = body;

    if (!mediaUrl || !mediaType) {
      return NextResponse.json({ success: false, error: "mediaUrl and mediaType are required" }, { status: 400 });
    }

    // Create the reel
    const reel = await Reel.create({
      userId: decoded.userId,
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
      await Scene.findOneAndUpdate(
        { _id: sceneId, userId: decoded.userId },
        { isPublishedAsReel: true, reelId: reel._id.toString() }
      );
    }

    console.log(`🎬 New reel created: ${reel._id} by user ${decoded.userId}`);

    return NextResponse.json({ success: true, reel }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Error creating reel:", error);
    return NextResponse.json({ success: false, error: "Failed to create reel" }, { status: 500 });
  }
}
