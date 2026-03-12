import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Scene from "@/models/Scene";
import Reel from "@/models/Reel";
import ReelLike from "@/models/ReelLike";
import ReelView from "@/models/ReelView";
import dbConnect from "@/lib/db";

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Delete only if it belongs to this user
    const deleted = await Scene.findOneAndDelete({
      _id: params.id,
      userId: decoded.userId
    });

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Scene not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cascade delete the associated Reel if it exists
    if (deleted.isPublishedAsReel && deleted.reelId) {
      await Reel.findByIdAndDelete(deleted.reelId);
      await ReelLike.deleteMany({ reelId: deleted.reelId });
      await ReelView.deleteMany({ reelId: deleted.reelId });
      console.log(`🗑️ Cascade deleted associated reel ${deleted.reelId}`);
    }

    console.log(`🗑️ Deleted scene ${params.id} for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      message: "Scene deleted successfully"
    });

  } catch (error: any) {
    console.error("❌ Error deleting scene:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete scene" },
      { status: 500 }
    );
  }
}
