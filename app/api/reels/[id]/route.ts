import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Reel from "@/models/Reel";
import Scene from "@/models/Scene";
import dbConnect from "@/lib/db";

// PATCH /api/reels/[id] — toggle privacy (public/private)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const body = await request.json();
    const { isPublic } = body;

    const reel = await Reel.findOneAndUpdate(
      { _id: params.id, userId: decoded.userId },
      { isPublic },
      { new: true }
    );

    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found or unauthorized" }, { status: 404 });
    }

    return NextResponse.json({ success: true, reel });
  } catch (error: any) {
    console.error("❌ Error updating reel privacy:", error);
    return NextResponse.json({ success: false, error: "Failed to update reel" }, { status: 500 });
  }
}

// DELETE /api/reels/[id] — delete a reel
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");
    if (!token) return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });

    const decoded = verifyToken(token);
    if (!decoded) return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });

    await dbConnect();

    const reel = await Reel.findOneAndDelete({ _id: params.id, userId: decoded.userId });

    if (!reel) {
      return NextResponse.json({ success: false, error: "Reel not found or unauthorized" }, { status: 404 });
    }

    // Reset scene flags
    if (reel.sceneId) {
      await Scene.findByIdAndUpdate(reel.sceneId, { isPublishedAsReel: false, reelId: null });
    }

    return NextResponse.json({ success: true, message: "Reel deleted" });
  } catch (error: any) {
    console.error("❌ Error deleting reel:", error);
    return NextResponse.json({ success: false, error: "Failed to delete reel" }, { status: 500 });
  }
}
