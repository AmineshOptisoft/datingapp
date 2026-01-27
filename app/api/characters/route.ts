import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Types } from "mongoose";

// GET - Retrieve all characters for a user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const lite = searchParams.get("lite");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const isLite = lite === "1" || lite === "true";

    const user = await User.findById(userId)
      .select(
        isLite
          ? "characters._id characters.characterName characters.characterAge characters.language characters.tags characters.description characters.visibility"
          : "characters"
      )
      .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: (user as any).characters || [],
    });
  } catch (error) {
    console.error("Get characters error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new character
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("Received character data:", body); // Debug logging
    
    const {
      userId,
      characterName,
      characterImage,
      characterAge,
      characterGender,
      language,
      tags,
      description,
      personality,
      scenario,
      firstMessage,
      visibility,
    } = body;

    // Detailed validation with specific error messages
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is missing" },
        { status: 400 }
      );
    }

    if (!characterName || characterName.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Character name is required" },
        { status: 400 }
      );
    }

    if (!characterAge && characterAge !== 0) {
      return NextResponse.json(
        { success: false, message: "Character age is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Description is required" },
        { status: 400 }
      );
    }

    if (!personality || personality.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Personality is required" },
        { status: 400 }
      );
    }

    if (!scenario || scenario.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Scenario is required" },
        { status: 400 }
      );
    }

    if (!firstMessage || firstMessage.trim() === "") {
      return NextResponse.json(
        { success: false, message: "First message is required" },
        { status: 400 }
      );
    }

    if (characterAge < 18) {
      return NextResponse.json(
        { success: false, message: "Character must be at least 18 years old" },
        { status: 400 }
      );
    }

    if (!characterGender || !["male", "female", "other"].includes(characterGender)) {
      return NextResponse.json(
        { success: false, message: "Valid character gender is required (male, female, or other)" },
        { status: 400 }
      );
    }

    if (tags && tags.length > 10) {
      return NextResponse.json(
        { success: false, message: "Cannot add more than 10 tags" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user already has 5 characters
    const existingUser = await User.findById(userId).select("characters");
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const characterCount = existingUser.characters?.length || 0;
    if (characterCount >= 5) {
      return NextResponse.json(
        { success: false, message: "Character limit reached. You can only create up to 5 characters." },
        { status: 400 }
      );
    }

    const newCharacter = {
      _id: new Types.ObjectId(),
      characterName,
      characterImage: characterImage || null,
      characterAge,
      characterGender,
      language: language || "English",
      tags: tags || [],
      description,
      personality,
      scenario,
      firstMessage,
      visibility: visibility || "private",
    };

    console.log("About to insert character:", JSON.stringify(newCharacter, null, 2));
    console.log("For userId:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { characters: newCharacter } },
      { new: true, runValidators: true }
    );

    console.log("Update result - User found:", !!user);
    if (user) {
      console.log("User characters count:", user.characters?.length || 0);
      console.log("User characters:", JSON.stringify(user.characters, null, 2));
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Character created successfully",
      data: newCharacter,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create character error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
