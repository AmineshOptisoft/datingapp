import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/admin/characters/[userId]/[charId] — Get single character
export async function GET(
  request: NextRequest,
  { params }: { params: { userId: string; charId: string } }
) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const user = await User.findById(params.userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    const character = (user as any).characters?.find(
      (c: any) => c._id.toString() === params.charId
    );

    if (!character) {
      return NextResponse.json({ success: false, error: "Character not found" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      character,
      user: {
        _id: (user as any)._id,
        name: (user as any).name,
        email: (user as any).email,
      },
    });
  } catch (error: any) {
    console.error("❌ Admin get character error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch character" }, { status: 500 });
  }
}

// PUT /api/admin/characters/[userId]/[charId] — Edit character
export async function PUT(
  request: NextRequest,
  { params }: { params: { userId: string; charId: string } }
) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const body = await request.json();

    // Build update object for each field
    const updateFields: any = {};
    const allowedFields = [
      "characterName", "characterImage", "characterAge", "characterGender",
      "language", "tags", "description", "personality", "scenario",
      "firstMessage", "visibility"
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateFields[`characters.$.${field}`] = body[field];
      }
    }

    if (Object.keys(updateFields).length === 0) {
      return NextResponse.json({ success: false, error: "No fields to update" }, { status: 400 });
    }

    const updated = await User.findOneAndUpdate(
      { _id: params.userId, "characters._id": params.charId },
      { $set: updateFields },
      { new: true, runValidators: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ success: false, error: "User or character not found" }, { status: 404 });
    }

    const updatedChar = (updated as any).characters.find(
      (c: any) => c._id.toString() === params.charId
    );

    return NextResponse.json({ success: true, character: updatedChar });
  } catch (error: any) {
    console.error("❌ Admin update character error:", error);
    return NextResponse.json({ success: false, error: "Failed to update character" }, { status: 500 });
  }
}
