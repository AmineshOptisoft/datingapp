import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/Persona";
import { writeFile } from "fs/promises";
import path from "path";

// GET - Fetch all personas for a user
export async function GET(req: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const personas = await Persona.find({ userId })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ personas }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching personas:", error);
    return NextResponse.json(
      { error: "Failed to fetch personas", details: error.message },
      { status: 500 }
    );
  }
}

// POST - Create new persona
export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const contentType = req.headers.get("content-type") || "";
    let userId: string, displayName: string, background: string, avatar: string | null = null, makeDefault: boolean = false;

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      userId = formData.get("userId") as string;
      displayName = formData.get("displayName") as string;
      background = formData.get("background") as string;
      makeDefault = formData.get("makeDefault") === "true";
      
      const avatarFile = formData.get("avatar") as File | null;
      
      if (avatarFile && avatarFile.size > 0 && typeof avatarFile.arrayBuffer === 'function') {
        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        
        const timestamp = Date.now();
        const randomString = Math.floor(Math.random() * 1000000000).toString();
        const ext = avatarFile.name.split('.').pop() || "png";
        const filename = `persona-${timestamp}-${randomString}.${ext}`;
        const uploadDir = path.join(process.cwd(), "public", "uploads");
        const filepath = path.join(uploadDir, filename);
        
        await writeFile(filepath, buffer);
        avatar = `/uploads/${filename}`;
      } else if (typeof formData.get("avatar") === "string") {
        // allow strings (like prior URL values) just in case
        avatar = formData.get("avatar") as string;
      }
    } else {
      // Fallback for JSON
      const body = await req.json();
      userId = body.userId;
      displayName = body.displayName;
      background = body.background;
      avatar = body.avatar || null;
      makeDefault = body.makeDefault === true;
    }

    // Validation
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    if (!displayName || !displayName.trim()) {
      return NextResponse.json({ error: "Display name is required" }, { status: 400 });
    }
    if (displayName.trim().length > 20) {
      return NextResponse.json({ error: "Display name cannot exceed 20 characters" }, { status: 400 });
    }
    if (background && background.length > 750) {
      return NextResponse.json({ error: "Background cannot exceed 750 characters" }, { status: 400 });
    }

    // If makeDefault is true, set all other personas to false
    if (makeDefault) {
      await Persona.updateMany({ userId }, { $set: { makeDefault: false } });
    }

    // Create new persona
    const newPersona = new Persona({
      userId,
      displayName: displayName.trim(),
      background: background?.trim() || "",
      avatar: avatar || "",
      makeDefault: makeDefault || false,
    });

    await newPersona.save();

    console.log("Persona created successfully:", newPersona._id);

    return NextResponse.json(
      { message: "Persona created successfully", persona: newPersona },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error creating persona:", error);
    return NextResponse.json(
      { error: "Failed to create persona", details: error.message },
      { status: 500 }
    );
  }
}
