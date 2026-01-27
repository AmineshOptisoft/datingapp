import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { ICharacter } from "@/types/user";

// GET - Retrieve public characters filtered by gender
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const gender = searchParams.get("gender"); // 'male' or 'female'

    if (!gender || !["male", "female"].includes(gender)) {
      return NextResponse.json(
        { success: false, message: "Valid gender parameter required (male or female)" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Find all users with public characters matching the requested gender
    // For "For Man" section: show female characters (gender=female)
    // For "For Female" section: show male characters (gender=male)
    const users = await User.find({
      "characters.visibility": "public",
      "characters.characterGender": gender,
    })
      .select("characters")
      .lean();

    // Extract and flatten public characters with the matching gender
    const publicCharacters: any[] = [];
    
    users.forEach((user: any) => {
      user.characters?.forEach((char: any) => {
        if (char.visibility === "public" && char.characterGender === gender) {
          publicCharacters.push({
            _id: char._id,
            userId: user._id,
            characterName: char.characterName,
            characterImage: char.characterImage,
            characterAge: char.characterAge,
            characterGender: char.characterGender,
            language: char.language,
            tags: char.tags,
            description: char.description,
            personality: char.personality,
            scenario: char.scenario,
            firstMessage: char.firstMessage,
            visibility: char.visibility,
            createdAt: char.createdAt,
            updatedAt: char.updatedAt,
          });
        }
      });
    });

    return NextResponse.json({
      success: true,
      data: publicCharacters,
      count: publicCharacters.length,
    });
  } catch (error) {
    console.error("Get public characters error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
