import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

// POST - Like or Unlike a character
// Body: { userId: string }
// If userId is already in likedBy → unlike (remove), else → like (add)
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    let body: { userId?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Find the user who owns this character
    const ownerUser = await User.findOne({ "characters._id": id });

    if (!ownerUser) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    const character = ownerUser.characters?.find(
      (c: any) => c._id.toString() === id
    );

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    const alreadyLiked = (character as any).likedBy?.includes(userId);

    let updatedUser;
    if (alreadyLiked) {
      // Unlike: remove userId from likedBy and decrement likes
      updatedUser = await User.findOneAndUpdate(
        { "characters._id": id },
        {
          $pull: { "characters.$.likedBy": userId },
          $inc: { "characters.$.likes": -1 },
        },
        { new: true }
      );
    } else {
      // Like: add userId to likedBy and increment likes
      updatedUser = await User.findOneAndUpdate(
        { "characters._id": id },
        {
          $addToSet: { "characters.$.likedBy": userId },
          $inc: { "characters.$.likes": 1 },
        },
        { new: true }
      );
    }

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update like" },
        { status: 500 }
      );
    }

    const updatedChar = updatedUser.characters?.find(
      (c: any) => c._id.toString() === id
    );

    return NextResponse.json({
      success: true,
      liked: !alreadyLiked,
      likes: (updatedChar as any)?.likes ?? 0,
    });
  } catch (error) {
    console.error("Like/Unlike character error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
