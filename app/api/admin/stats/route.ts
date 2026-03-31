import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Reel from "@/models/Reel";
import GiftTransaction from "@/models/GiftTransaction";

// GET /api/admin/stats — Dashboard statistics
export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const [totalUsers, totalReels, totalGifts, usersWithChars] = await Promise.all([
      User.countDocuments({ role: { $ne: "admin" } }),
      Reel.countDocuments(),
      GiftTransaction.countDocuments(),
      User.aggregate([
        { $match: { role: { $ne: "admin" } } },
        { $project: { charCount: { $size: { $ifNull: ["$characters", []] } } } },
        { $group: { _id: null, total: { $sum: "$charCount" } } },
      ]),
    ]);

    const totalCharacters = usersWithChars[0]?.total || 0;

    // Recent users (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const recentUsers = await User.countDocuments({
      role: { $ne: "admin" },
      createdAt: { $gte: sevenDaysAgo },
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalUsers,
        totalCharacters,
        totalReels,
        totalGifts,
        recentUsers,
      },
    });
  } catch (error: any) {
    console.error("❌ Admin stats error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch stats" }, { status: 500 });
  }
}
