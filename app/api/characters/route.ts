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
    // Support both FormData (with file upload) and JSON (with URL)
    const contentType = request.headers.get("content-type") || "";
    
    let userId: string, characterName: string, characterImage: string | null,
      characterAge: number, characterGender: string, language: string,
      tags: string[], description: string, personality: string,
      scenario: string, firstMessage: string, visibility: string;

    if (contentType.includes("multipart/form-data")) {
      // FormData path — file upload support
      const formData = await request.formData();

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

      // tags may be sent as a comma-separated string or JSON array string
      const rawTags = formData.get("tags") as string | null;
      tags = rawTags
        ? rawTags.startsWith("[") ? JSON.parse(rawTags) : rawTags.split(",").map(t => t.trim())
        : [];

      // Handle image file upload
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
        // Allow passing a URL string directly via FormData (optional)
        characterImage = (formData.get("characterImageUrl") as string) || null;
      }

    } else {
      // JSON path — accepts a pre-uploaded URL (not base64)
      const body = await request.json();
      console.log("Received character data:", body);

      ({
        userId, characterName, characterImage = null,
        characterAge, characterGender, language,
        tags, description, personality,
        scenario, firstMessage, visibility,
      } = body);
    }

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

    // scenario is optional

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
      scenario: scenario || "",
      firstMessage,
      visibility: visibility || "private",
    };

    console.log("About to insert character for userId:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { characters: newCharacter } },
      { new: true, runValidators: true }
    );

    console.log("Update result - User found:", !!user);
    if (user) {
      console.log("User characters count:", user.characters?.length || 0);
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
