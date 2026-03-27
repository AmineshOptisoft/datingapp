import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import GiftTransaction from "@/models/GiftTransaction";
import { GIFTS } from "@/lib/constants/gifts";

// GET /api/users/gifts-received?userId=xxx
// Returns all gifts received by all characters created by this user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = parseInt(searchParams.get("limit") || "30", 10);
    const skip = (page - 1) * limit;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "userId is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    // 1. Get all character IDs for this user
    const user = await User.findById(userId)
      .select("characters._id characters.characterName characters.characterImage")
      .lean();

    if (!user) {
      return NextResponse.json(
        { success: false, error: "User not found" },
        { status: 404 }
      );
    }

    const characters = (user as any).characters || [];

    if (characters.length === 0) {
      return NextResponse.json({
        success: true,
        gifts: [],
        pagination: { currentPage: page, totalPages: 0, totalGifts: 0, hasMore: false },
      });
    }

    // Build a map for quick character lookup
    const characterMap: Record<string, { name: string; image: string | null }> = {};
    const receiverIds: string[] = [];

    for (const char of characters) {
      const id = char._id.toString();
      characterMap[id] = { name: char.characterName, image: char.characterImage || null };
      characterMap[`character-${id}`] = characterMap[id];
      characterMap[`ai-${id}`] = characterMap[id];
      receiverIds.push(id, `character-${id}`, `ai-${id}`);
    }

    // 2. Query all gift transactions for these receivers
    const filter = { receiver: { $in: receiverIds } };
    const totalGifts = await GiftTransaction.countDocuments(filter);

    const giftTransactions = await GiftTransaction.find(filter)
      .populate({ path: "sender", select: "name avatar", model: User })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Build gift image lookup from constants
    const giftImageMap: Record<number, string> = {};
    for (const g of GIFTS) {
      giftImageMap[g.id] = g.image;
    }

    const gifts = giftTransactions.map((tx: any) => {
      const charInfo = characterMap[tx.receiver] || { name: "Unknown Character", image: null };
      return {
        _id: tx._id,
        giftName: tx.giftName,
        giftImage: giftImageMap[tx.giftId] || null,
        price: tx.price,
        sender: {
          _id: tx.sender?._id || "unknown",
          name: tx.sender?.name || "Unknown User",
          avatar: tx.sender?.avatar || null,
        },
        character: {
          name: charInfo.name,
          image: charInfo.image,
        },
        createdAt: tx.createdAt,
      };
    });

    return NextResponse.json({
      success: true,
      gifts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGifts / limit),
        totalGifts,
        hasMore: page * limit < totalGifts,
      },
    });
  } catch (error) {
    console.error("Error fetching user gifts:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch gifts" },
      { status: 500 }
    );
  }
}
