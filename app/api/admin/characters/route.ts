import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/admin/characters — List all characters across all users
export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    // Find all users who have characters
    const matchStage: any = {
      "characters.0": { $exists: true },
      role: { $ne: "admin" },
    };

    const pipeline: any[] = [
      { $match: matchStage },
      { $unwind: "$characters" },
    ];

    // If searching, filter by character name
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { "characters.characterName": { $regex: search, $options: "i" } },
            { name: { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // Get total count first
    const countPipeline = [...pipeline, { $count: "total" }];
    const countResult = await User.aggregate(countPipeline);
    const total = countResult[0]?.total || 0;

    // Then get paginated results
    pipeline.push(
      { $sort: { "characters.createdAt": -1 } },
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          userId: "$_id",
          userName: "$name",
          userEmail: "$email",
          userAvatar: "$avatar",
          character: "$characters",
        },
      }
    );

    const characters = await User.aggregate(pipeline);

    return NextResponse.json({
      success: true,
      characters,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Admin list characters error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch characters" }, { status: 500 });
  }
}
