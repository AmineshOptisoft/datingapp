import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateOTP, storeOTP } from "@/lib/otp";
import { sendSMSOTP } from "@/lib/sms";
import { sendEmailOTP } from "@/lib/email";
import { hashPassword } from "@/lib/auth";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "@/utils/validators";

export async function POST(request: NextRequest) {
  try {
    console.log("🔵 Registration API called");

    const body = await request.json();
    console.log("📦 Request body:", { ...body, password: "***" });

    const { email, phoneNumber, password, name } = body;

    // Validation
    if (!email || !phoneNumber || !password || !name) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (!validatePhone(phoneNumber)) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Invalid phone number format. Use international format (+1234567890)",
        },
        { status: 400 }
      );
    }

    const passwordCheck = validatePassword(password);
    if (!passwordCheck.valid) {
      return NextResponse.json(
        { success: false, message: passwordCheck.message },
        { status: 400 }
      );
    }

    console.log("🔌 Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected");

    console.log("🔍 Checking for existing user...");
    const existingUser = await User.findOne({
      $or: [{ email }, { phoneNumber }],
    });

    if (existingUser) {
      if (existingUser.email === email) {
        return NextResponse.json(
          { success: false, message: "Email already registered" },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { success: false, message: "Phone number already registered" },
        { status: 400 }
      );
    }

    console.log("🔐 Hashing password...");
    const hashedPassword = await hashPassword(password);

    console.log("👤 Creating user...");
    const user = new User({
      email,
      phoneNumber,
      password: hashedPassword,
      name,
      isEmailVerified: false,
      isPhoneVerified: false,
    });

    await user.save();
    console.log(`✅ User created: ${user._id}`);

    // Generate ONE OTP for both email and phone
    console.log("🔢 Generating unified OTP...");
    const unifiedOTP = generateOTP();

    // Store with a unified key for the user
    console.log("💾 Storing unified OTP...");
    await storeOTP(`user:${user._id}`, unifiedOTP, 10);

    // Send same OTP to both channels
    console.log("📧 Sending OTP to email...");
    const emailResult = await sendEmailOTP(email, unifiedOTP, "REGISTRATION");

    console.log("📱 Sending OTP to phone...");
    const smsResult = await sendSMSOTP(phoneNumber, unifiedOTP, "REGISTRATION");

    if (!emailResult.success && !smsResult.success) {
      console.warn("⚠️ Both OTP channels failed");
    }

    console.log("✅ Registration successful - Same OTP sent to both channels");
    return NextResponse.json(
      {
        success: true,
        message:
          "Registration successful. Please verify using the OTP sent to your email or phone.",
        data: {
          userId: user._id,
          email: user.email,
          phoneNumber: user.phoneNumber,
        },
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("❌ Registration error:", error);

    if (error.code === 11000) {
      return NextResponse.json(
        { success: false, message: "Email or phone number already exists" },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: "Registration failed",
        error: error.message,
      },
      { status: 500 }
    );
  }
}
