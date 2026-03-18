import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

// POST - Increment interaction count for a character
// Called when a user starts a chat with this character
// Body: { userId: string }
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

    // Find user who owns this character
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

    const alreadyInteracted = (character as any).interactedBy?.includes(userId);

    let updatedUser;
    
    if (alreadyInteracted) {
      // User already interacted, don't increment
      return NextResponse.json({
        success: true,
        interactions: (character as any).interactions ?? 0,
      });
    }

    // New interaction, increment and add user to interactedBy
    updatedUser = await User.findOneAndUpdate(
      { "characters._id": id },
      { 
        $addToSet: { "characters.$.interactedBy": userId },
        $inc: { "characters.$.interactions": 1 } 
      },
      { new: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to interact" },
        { status: 500 }
      );
    }

    const updatedChar = updatedUser.characters?.find(
      (c: any) => c._id.toString() === id
    );

    return NextResponse.json({
      success: true,
      interactions: (updatedChar as any)?.interactions ?? 0,
    });
  } catch (error) {
    console.error("Interaction count error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
