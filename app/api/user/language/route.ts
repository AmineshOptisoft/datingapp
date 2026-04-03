import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(decoded.userId).select("preferredLanguage").lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, language: (user as any).preferredLanguage || 'English' });
  } catch (error: any) {
    console.error("Error fetching preferred language:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
    }

    const { language } = await request.json();

    if (!language) {
      return NextResponse.json({ success: false, error: "Language is required" }, { status: 400 });
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { preferredLanguage: language },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, language: user.preferredLanguage });
  } catch (error: any) {
    console.error("Error updating preferred language:", error);
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 });
  }
}
