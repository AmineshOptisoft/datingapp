import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// PUT - Update a character
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = params.id;
    const body = await request.json();
    const {
      userId,
      characterName,
      characterImage,
      characterAge,
      language,
      tags,
      description,
      personality,
      scenario,
      firstMessage,
      visibility,
    } = body;

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Validation
    if (characterAge && characterAge < 18) {
      return NextResponse.json(
        { success: false, message: "Character must be at least 18 years old" },
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

    // Build update object
    const updateFields: any = {};
    if (characterName !== undefined) updateFields["characters.$.characterName"] = characterName;
    if (characterImage !== undefined) updateFields["characters.$.characterImage"] = characterImage;
    if (characterAge !== undefined) updateFields["characters.$.characterAge"] = characterAge;
    if (language !== undefined) updateFields["characters.$.language"] = language;
    if (tags !== undefined) updateFields["characters.$.tags"] = tags;
    if (description !== undefined) updateFields["characters.$.description"] = description;
    if (personality !== undefined) updateFields["characters.$.personality"] = personality;
    if (scenario !== undefined) updateFields["characters.$.scenario"] = scenario;
    if (firstMessage !== undefined) updateFields["characters.$.firstMessage"] = firstMessage;
    if (visibility !== undefined) updateFields["characters.$.visibility"] = visibility;

    const user = await User.findOneAndUpdate(
      { _id: userId, "characters._id": characterId },
      { $set: updateFields },
      { new: true, runValidators: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User or character not found" },
        { status: 404 }
      );
    }

    const updatedCharacter = user.characters?.find(
      (char: any) => char._id.toString() === characterId
    );

    return NextResponse.json({
      success: true,
      message: "Character updated successfully",
      data: updatedCharacter,
    });
  } catch (error: any) {
    console.error("Update character error:", error);
    
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

// DELETE - Delete a character
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const characterId = params.id;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findByIdAndUpdate(
      userId,
      { $pull: { characters: { _id: characterId } } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Character deleted successfully",
    });
  } catch (error) {
    console.error("Delete character error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
