import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import ReelView from "@/models/ReelView";
import dbConnect from "@/lib/db";

// POST /api/reels/[id]/view — increment view (unique per user/IP)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    
    // Get IP for anonymous fingerprinting
    const ip = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown";

    await dbConnect();

    const reel = await Reel.findById(params.id);
    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found" }, { status: 404 });
    }

    let userId = null;
    if (token) {
      const decoded = verifyToken(token);
      if (decoded) userId = decoded.userId;
    }

    // Try to record view (unique index will ignore duplicates silently if we handle the error)
    if (userId) {
      // Authenticated view
      const existing = await ReelView.findOne({ reelId: params.id, userId });
      if (!existing) {
        await ReelView.create({ reelId: params.id, userId });
      }
    } else {
      // Anonymous view
      const existing = await ReelView.findOne({ reelId: params.id, fingerprint: ip });
      if (!existing) {
        await ReelView.create({ reelId: params.id, fingerprint: ip });
      }
    }

    const viewsCount = await ReelView.countDocuments({ reelId: params.id });

    return NextResponse.json({ success: true, viewsCount });
  } catch (error: any) {
    if (error.code === 11000) {
      // Duplicate key error (already viewed) - just return current count
      const viewsCount = await ReelView.countDocuments({ reelId: params.id });
      return NextResponse.json({ success: true, viewsCount });
    }
    console.error("❌ Error incrementing view:", error);
    return NextResponse.json({ success: false, error: "Failed to track view" }, { status: 500 });
  }
}

