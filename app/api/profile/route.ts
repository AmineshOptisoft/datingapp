import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import path from "path";
import fs from "fs";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    const userId = formData.get("userId") as string;
    const name = formData.get("name") as string;
    const bio = formData.get("bio") as string;
    const email = formData.get("email") as string;
    const phone = formData.get("phone") as string;
    const avatarFile = formData.get("avatar") as File | null;

    if (!userId || !name || !email) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      );
    }

    await dbConnect();

    const updateData: any = { name, bio };
    if (phone) updateData.phoneNumber = phone;

    // Handle avatar file upload
    if (avatarFile && avatarFile.size > 0) {
      const uploadsDir = path.join(process.cwd(), "public", "uploads");

      // Create uploads folder if it doesn't exist
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const ext = path.extname(avatarFile.name) || ".jpg";
      const uniqueName = `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
      const filePath = path.join(uploadsDir, uniqueName);

      // Save file to disk
      const arrayBuffer = await avatarFile.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(filePath, buffer);

      // Store only the URL path in DB
      updateData.avatar = `/uploads/${uniqueName}`;
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
