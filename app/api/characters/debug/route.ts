import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// Debug endpoint to check what's actually in the database
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findById(userId).select("characters").lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Return all characters with their visibility and gender
    const characterDetails = (user as any).characters?.map((char: any) => ({
      _id: char._id,
      name: char.characterName,
      age: char.characterAge,
      gender: char.characterGender,
      visibility: char.visibility,
      description: char.description?.substring(0, 50),
    }));

    return NextResponse.json({
      success: true,
      data: characterDetails,
      count: characterDetails?.length || 0,
    });
  } catch (error) {
    console.error("Debug characters error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
