import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyOTP } from "@/lib/otp";

export async function POST(request: NextRequest) {
  try {
    const { userId, otp } = await request.json();
    if (!userId || !otp || otp.length !== 6)
      return NextResponse.json(
        { success: false, message: "User ID and valid OTP required" },
        { status: 400 }
      );

    await dbConnect();

    const valid = await verifyOTP(`user:${userId}`, otp);
    if (!valid)
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );

    const user = await User.findById(userId);
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    user.isEmailVerified = true;
    user.isPhoneVerified = true;
    await user.save();

    // Create wallet with 100 free coins for new user
    try {
      const { WalletService } = await import("@/lib/walletService");
      await WalletService.getWallet(user._id.toString());
      console.log(`✨ Wallet created for new user ${user._id} with 100 free coins`);
    } catch (walletError) {
      console.error("⚠️ Failed to create wallet, but user verified:", walletError);
      // Don't fail the verification if wallet creation fails
    }

    return NextResponse.json(
      { success: true, message: "Verification successful", data: user },
      { status: 200 }
    );
  } catch {
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
