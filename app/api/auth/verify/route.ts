import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyOTP } from "@/lib/otp";
import { validateOTP } from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const { userId, otp } = await request.json();

    if (!userId || !otp) {
      return NextResponse.json(
        { success: false, message: "User ID and OTP are required" },
        { status: 400 }
      );
    }

    if (!validateOTP(otp)) {
      return NextResponse.json(
        { success: false, message: "OTP must be 6 digits" },
        { status: 400 }
      );
    }

    // Verify OTP using unified key
    const isValid = await verifyOTP(`user:${userId}`, otp);

    if (!isValid) {
      return NextResponse.json(
        { success: false, message: "Invalid or expired OTP" },
        { status: 400 }
      );
    }

    // Update user - mark both email and phone as verified
    const user = await User.findByIdAndUpdate(
      userId,
      {
        isEmailVerified: true,
        isPhoneVerified: true,
      },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    console.log(`✅ User verified: ${user._id}`);

    return NextResponse.json(
      {
        success: true,
        message: "Verification successful! Both email and phone verified.",
        data: {
          isEmailVerified: true,
          isPhoneVerified: true,
        },
      },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("❌ Verification error:", error);
    return NextResponse.json(
      { success: false, message: "Verification failed" },
      { status: 500 }
    );
  }
}
