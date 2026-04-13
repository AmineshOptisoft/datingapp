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

    // Check if the requester is an admin
    const User = (await import("@/models/User")).default;
    const requestingUser = await User.findById(decoded.userId).select("role").lean();
    const isAdmin = requestingUser && (requestingUser as any).role === "admin";

    // Admin can delete any scene, regular users can only delete their own
    const query: any = { _id: params.id };
    if (!isAdmin) {
      query.userId = decoded.userId;
    }

    const deleted = await Scene.findOneAndDelete(query);

    if (!deleted) {
      return NextResponse.json(
        { success: false, error: "Scene not found or unauthorized" },
        { status: 404 }
      );
    }

    // Cascade delete ALL associated Reels (match by reelId OR by sceneId)
    const reelIdsToDelete: string[] = [];

    // 1) The reelId stored on the scene itself
    if (deleted.reelId) {
      reelIdsToDelete.push(deleted.reelId);
    }

    // 2) Any reel that references this scene via sceneId (covers edge cases)
    const reelsByScene = await Reel.find({ sceneId: params.id }).select("_id").lean();
    reelsByScene.forEach((r: any) => {
      const rid = r._id.toString();
      if (!reelIdsToDelete.includes(rid)) reelIdsToDelete.push(rid);
    });

    if (reelIdsToDelete.length > 0) {
      await Promise.all([
        Reel.deleteMany({ _id: { $in: reelIdsToDelete } }),
        ReelLike.deleteMany({ reelId: { $in: reelIdsToDelete } }),
        ReelView.deleteMany({ reelId: { $in: reelIdsToDelete } }),
      ]);
      console.log(`🗑️ Cascade deleted ${reelIdsToDelete.length} reel(s) for scene ${params.id}`);
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
