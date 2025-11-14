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

    const user = await User.findByIdAndUpdate(
      userId,
      { isEmailVerified: true, isPhoneVerified: true },
      { new: true }
    );
    if (!user)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

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
