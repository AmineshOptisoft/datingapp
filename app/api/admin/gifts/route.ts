import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import GiftTransaction from "@/models/GiftTransaction";
import User from "@/models/User";

// GET /api/admin/gifts — List all gift transactions
export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const [gifts, total] = await Promise.all([
      GiftTransaction.find()
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      GiftTransaction.countDocuments(),
    ]);

    // Collect all unique sender/receiver IDs
    const userIds = new Set<string>();
    gifts.forEach((g: any) => {
      if (g.sender) userIds.add(g.sender.toString());
      if (g.receiver) userIds.add(g.receiver.toString());
    });

    // Fetch user info for all relevant IDs
    const users = await User.find({ _id: { $in: Array.from(userIds) } })
      .select("_id name email avatar")
      .lean();

    const userMap: Record<string, any> = {};
    users.forEach((u: any) => {
      userMap[u._id.toString()] = { name: u.name, email: u.email, avatar: u.avatar };
    });

    // Also check for character-based receivers (format: characterId or characterName)
    // Receivers might be stored as character IDs
    const enrichedGifts = gifts.map((g: any) => ({
      ...g,
      senderInfo: userMap[g.sender?.toString()] || { name: "Unknown", email: "" },
      receiverInfo: userMap[g.receiver?.toString()] || { name: g.receiver || "Unknown", email: "" },
    }));

    return NextResponse.json({
      success: true,
      gifts: enrichedGifts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Admin list gifts error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch gifts" }, { status: 500 });
  }
}
