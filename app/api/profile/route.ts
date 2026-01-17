import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, name, bio, email, phone, avatarBase64 } = body;

    if (!userId || !name || !email || !phone) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Email cannot be changed - only update name, bio, phone, and avatar
    const updateData: any = { name, bio, phoneNumber: phone };

    if (avatarBase64) {
      // Here you need to save base64 image to storage or DB. For this example, save directly for demo:
      updateData.avatar = avatarBase64;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser)
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );

    return NextResponse.json({
      success: true,
      message: "Profile updated",
      data: updatedUser,
    });
  } catch (error) {
    console.error("Profile update error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
