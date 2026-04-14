import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";
import NotificationHistory from "@/models/NotificationHistory";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Auth Check
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    // Get today's start and end date
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Aggregate stats for today
    const [todayCount, totalSentAllTime, failedCount] = await Promise.all([
      NotificationHistory.countDocuments({
        sentAt: { $gte: today, $lt: tomorrow },
        status: { $in: ["sent", "delivered"] }
      }),
      NotificationHistory.countDocuments({
        status: { $in: ["sent", "delivered"] }
      }),
      NotificationHistory.countDocuments({
        sentAt: { $gte: today, $lt: tomorrow },
        status: "failed"
      })
    ]);

    // Aggregate by type
    const byType = await NotificationHistory.aggregate([
      { $match: { sentAt: { $gte: today, $lt: tomorrow } } },
      { $group: { _id: "$type", count: { $sum: 1 } } }
    ]);

    const statsByType = byType.reduce((acc, curr) => {
      acc[curr._id] = curr.count;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({ 
      success: true, 
      stats: {
        todaySent: todayCount,
        totalSent: totalSentAllTime,
        todayFailed: failedCount,
        byType: statsByType,
      } 
    });
  } catch (error: any) {
    console.error("GET Notification Stats Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notification stats" },
      { status: 500 }
    );
  }
}
