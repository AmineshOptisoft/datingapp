import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";

// GET - Fetch single character by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectToDatabase();
    const { id } = params;

    // Find user with the character
    const user = await User.findOne({ "characters._id": id }).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    const character = (user as any).characters.find((c: any) => c._id.toString() === id);

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
    
    // Support both FormData and JSON
    // Always try FormData first, avoiding unreliable Content-Type header checks from React Native
    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch {
      // JSON fallback will trigger below
    }
    
    let userId: string, characterName: string, characterImage: string | null | undefined,
      characterAge: number, characterGender: string, language: string,
      tags: string[], description: string, personality: string,
      scenario: string, firstMessage: string, visibility: string;

    if (formData) {
      userId        = formData.get("userId") as string;
      characterName = formData.get("characterName") as string;
      characterAge  = Number(formData.get("characterAge"));
      characterGender = formData.get("characterGender") as string;
      language      = (formData.get("language") as string) || "English";
      description   = formData.get("description") as string;
      personality   = formData.get("personality") as string;
      scenario      = (formData.get("scenario") as string) || "";
      firstMessage  = formData.get("firstMessage") as string;
      visibility    = (formData.get("visibility") as string) || "private";

      const rawTags = formData.get("tags") as string | null;
      tags = rawTags
        ? rawTags.startsWith("[") ? JSON.parse(rawTags) : rawTags.split(",").map(t => t.trim())
        : [];

      // Handle image file upload for updates
      const imageFile = formData.get("characterImage") as File | null;
      if (imageFile && imageFile.size > 0) {
        const path = await import("path");
        const fs   = await import("fs");

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext        = path.extname(imageFile.name) || ".jpg";
        const uniqueName = `char-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath   = path.join(uploadsDir, uniqueName);

        const arrayBuffer = await imageFile.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

        characterImage = `/uploads/${uniqueName}`;
      } else {
        characterImage = undefined; // Do not overwrite if no new image provided
      }
    } else {
      const body = await request.json();
      ({
        userId, characterName, characterImage,
        characterAge, characterGender, language,
        tags, description, personality,
        scenario, firstMessage, visibility,
      } = body);
    }

    console.log("📥 Received character update data:", { characterName, characterAge, characterGender, visibility });

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

    if (!characterGender || !["male", "female", "other"].includes(characterGender)) {
      return NextResponse.json(
        { success: false, message: "Valid character gender is required (male, female, or other)" },
        { status: 400 }
      );
    }

    if (!description || !personality || !scenario || !firstMessage) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Find user with the character and verify ownership
    const user = await User.findOne({ _id: userId, "characters._id": id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prepare update object dynamically to not overwrite image if not provided
    const setQuery: any = {
      "characters.$.characterName": characterName.trim(),
      "characters.$.characterAge": characterAge,
      "characters.$.characterGender": characterGender,
      "characters.$.language": language,
      "characters.$.tags": tags || [],
      "characters.$.description": description.trim(),
      "characters.$.personality": personality.trim(),
      "characters.$.scenario": scenario.trim(),
      "characters.$.firstMessage": firstMessage.trim(),
      "characters.$.visibility": visibility || "private",
    };

    if (characterImage !== undefined) {
      setQuery["characters.$.characterImage"] = characterImage;
    }

    // Update the character within the user's characters array
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, "characters._id": id },
      { $set: setQuery },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update character" },
        { status: 500 }
      );
    }

    // Find the updated character to return
    const updatedCharacter = updatedUser.characters?.find((c: any) => c._id.toString() === id);

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

    // Find user with the character and verify ownership
    const user = await User.findOne({ _id: userId, "characters._id": id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove character from the user's characters array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { characters: { _id: id } } },
      { new: true }
    );

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
