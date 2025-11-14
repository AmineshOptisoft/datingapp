import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendEmailOTP } from "@/lib/email";
import { sendSMSOTP } from "@/lib/sms"; // Mock SMS

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, email, phoneNumber, password } = body;

    if (!name || !email || !phoneNumber || !password)
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );

    await dbConnect();

    const exists = await User.findOne({ $or: [{ email }, { phoneNumber }] });
    if (exists)
      return NextResponse.json(
        { success: false, message: "Email or phone number already registered" },
        { status: 400 }
      );

    const hashedPassword = await hashPassword(password);

    const user = await new User({
      name,
      email,
      phoneNumber,
      password: hashedPassword,
      isEmailVerified: false,
      isPhoneVerified: false,
    }).save();

    // Generate single OTP for both channels
    const otp = generateOTP();
    await storeOTP(`user:${user._id}`, otp, 10);

    // Send OTP to email and mock SMS to phone
    await sendEmailOTP(email, otp, "REGISTRATION");
    sendSMSOTP(phoneNumber, otp, "REGISTRATION"); // For now console.log

    return NextResponse.json(
      {
        success: true,
        message: "Registration successful. Please verify OTP.",
        data: { userId: user._id },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "Registration failed" },
      { status: 500 }
    );
  }
}
