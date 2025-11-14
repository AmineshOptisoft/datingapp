import { NextResponse } from "next/server";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendEmailOTP } from "@/lib/email";
import { sendSMSOTP } from "@/lib/sms";
import User from "@/models/User";

async function getEmailByUserId(userId: string): Promise<string | null> {
  const user = await User.findById(userId);
  return user?.email || null;
}

async function getPhoneByUserId(userId: string): Promise<string | null> {
  const user = await User.findById(userId);
  return user?.phoneNumber || null;
}

export async function POST(request: Request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json({ message: "Missing userId" }, { status: 400 });
    }

    const otp = generateOTP();
    await storeOTP(`user:${userId}`, otp, 10);

    const email = await getEmailByUserId(userId);
    const phone = await getPhoneByUserId(userId);

    if (!email || !phone) {
      return NextResponse.json(
        { message: "User email or phone not found" },
        { status: 404 }
      );
    }

    await sendEmailOTP(email, otp, "RESEND");
    await sendSMSOTP(phone, otp, "RESEND");

    return NextResponse.json(
      { message: "OTP resent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Resend OTP error:", error);
    return NextResponse.json(
      { message: "Failed to resend OTP" },
      { status: 500 }
    );
  }
}
