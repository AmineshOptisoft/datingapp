import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Persona from "@/models/Persona";

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

    const body = await req.json();
    const { displayName, background, avatar, makeDefault } = body;

    // Validation
    if (displayName && displayName.trim().length > 20) {
      return NextResponse.json(
        { error: "Display name cannot exceed 20 characters" },
        { status: 400 }
      );
    }

    if (background && background.length > 750) {
      return NextResponse.json(
        { error: "Background cannot exceed 750 characters" },
        { status: 400 }
      );
    }

    // Get the persona to find userId
    const existingPersona = await Persona.findById(params.id);
    
    if (!existingPersona) {
      return NextResponse.json(
        { error: "Persona not found" },
        { status: 404 }
      );
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
      {
        message: "Persona updated successfully",
        persona: updatedPersona,
      },
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
