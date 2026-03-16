import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/Persona";
import { writeFile } from "fs/promises";
import path from "path";

// GET - Fetch single persona
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const persona = await Persona.findById(params.id).lean();

    if (!persona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ persona }, { status: 200 });
  } catch (error: any) {
    console.error("Error fetching persona:", error);
    return NextResponse.json(
      { error: "Failed to fetch persona", details: error.message },
      { status: 500 }
    );
  }
}

// PUT - Update persona
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    let displayName: string | undefined, background: string | undefined, avatar: string | undefined, makeDefault: boolean | undefined;

    // Always try FormData first (handles React Native, Postman, and Web browsers)
    let formData: FormData | null = null;
    try {
      formData = await req.formData();
    } catch {
      // not form-data, will try JSON below
    }

    if (formData) {
      if (formData.has("displayName")) displayName = formData.get("displayName") as string;
      if (formData.has("background")) background = formData.get("background") as string;
      if (formData.has("makeDefault")) makeDefault = formData.get("makeDefault") === "true";

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
        avatar = formData.get("avatar") as string;
      }
    } else {
      const body = await req.json();
      displayName = body.displayName;
      background = body.background;
      avatar = body.avatar;
      makeDefault = body.makeDefault;
    }

    // Validation
    if (displayName && displayName.trim().length > 20) {
      return NextResponse.json({ error: "Display name cannot exceed 20 characters" }, { status: 400 });
    }
    if (background && background.length > 750) {
      return NextResponse.json({ error: "Background cannot exceed 750 characters" }, { status: 400 });
    }

    // Get the persona to find userId
    const existingPersona = await Persona.findById(params.id);
    if (!existingPersona) {
      return NextResponse.json({ error: "Persona not found" }, { status: 404 });
    }

    // If makeDefault is true, set all other personas to false
    if (makeDefault) {
      await Persona.updateMany(
        { userId: existingPersona.userId, _id: { $ne: params.id } },
        { $set: { makeDefault: false } }
      );
    }

    // Update the persona
    const updatedPersona = await Persona.findByIdAndUpdate(
      params.id,
      {
        ...(displayName !== undefined && { displayName: displayName.trim() }),
        ...(background !== undefined && { background: background.trim() }),
        ...(avatar !== undefined && { avatar }),
        ...(makeDefault !== undefined && { makeDefault }),
      },
      { new: true, runValidators: true }
    );

    console.log("Persona updated successfully:", updatedPersona?._id);

    return NextResponse.json(
      { message: "Persona updated successfully", persona: updatedPersona },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error updating persona:", error);
    return NextResponse.json(
      { error: "Failed to update persona", details: error.message },
      { status: 500 }
    );
  }
}

// DELETE - Delete persona
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const deletedPersona = await Persona.findByIdAndDelete(params.id);

    if (!deletedPersona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
    }

    console.log("Persona deleted successfully:", params.id);

    return NextResponse.json(
      { message: "Persona deleted successfully" },
      { status: 200 }
    );
  } catch (error: any) {
    console.error("Error deleting persona:", error);
    return NextResponse.json(
      { error: "Failed to delete persona", details: error.message },
      { status: 500 }
    );
  }
}
