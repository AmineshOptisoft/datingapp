import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { WalletService } from "@/lib/walletService";

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

    // Get or create wallet
    const wallet = await WalletService.getWallet(decoded.userId);

    return NextResponse.json({
      success: true,
      balance: wallet.balance,
      isLifetime: wallet.isLifetime,
      lifetimeCoins: wallet.lifetimeCoins,
      totalSpent: wallet.totalSpent,
      totalPurchased: wallet.totalPurchased,
    });

  } catch (error: any) {
    console.error("❌ Error fetching wallet:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch wallet" },
      { status: 500 }
    );
  }
}
