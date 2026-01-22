import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/mongodb";
import Character from "@/models/Character";

// GET - Fetch single character by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    const character = await Character.findById(id);

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error("Error fetching character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch character" },
      { status: 500 }
    );
  }
}

// PUT - Update character
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
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

    // Validation
    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    if (!characterName || characterName.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Character name is required" },
        { status: 400 }
      );
    }

    if (!characterAge || characterAge < 18) {
      return NextResponse.json(
        { success: false, message: "Character must be at least 18 years old" },
        { status: 400 }
      );
    }

    if (!description || !personality || !scenario || !firstMessage) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Find character and verify ownership
    const character = await Character.findById(id);

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    if (character.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to update this character" },
        { status: 403 }
      );
    }

    // Update character
    const updatedCharacter = await Character.findByIdAndUpdate(
      id,
      {
        characterName: characterName.trim(),
        characterImage,
        characterAge,
        language,
        tags: tags || [],
        description: description.trim(),
        personality: personality.trim(),
        scenario: scenario.trim(),
        firstMessage: firstMessage.trim(),
        visibility: visibility || "private",
      },
      { new: true, runValidators: true }
    );

    return NextResponse.json({
      success: true,
      message: "Character updated successfully",
      character: updatedCharacter,
    });
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update character" },
      { status: 500 }
    );
  }
}

// DELETE - Delete character
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    // Find character and verify ownership
    const character = await Character.findById(id);

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    if (character.userId.toString() !== userId) {
      return NextResponse.json(
        { success: false, message: "Unauthorized to delete this character" },
        { status: 403 }
      );
    }

    await Character.findByIdAndDelete(id);

    return NextResponse.json({
      success: true,
      message: "Character deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete character" },
      { status: 500 }
    );
  }
}
