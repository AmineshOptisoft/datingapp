import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import Scene from "@/models/Scene";
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

    console.log(`📚 Fetched ${scenes.length} scenes for user ${decoded.userId}`);

    return NextResponse.json({
      success: true,
      scenes,
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
