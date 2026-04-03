import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// GET /api/admin/users/[id] — Get single user details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const user = await User.findById(params.id)
      .select("-password -resetPasswordToken -resetPasswordExpires -authToken")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("❌ Admin get user error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch user" }, { status: 500 });
  }
}

// PUT /api/admin/users/[id] — Update user
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const body = await request.json();
    const { name, email, avatar, bio, country } = body;

    const updateData: any = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email.toLowerCase();
    if (avatar !== undefined) updateData.avatar = avatar;
    if (bio !== undefined) updateData.bio = bio;
    if (country !== undefined) updateData.country = country;

    const user = await User.findByIdAndUpdate(
      params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).select("-password -resetPasswordToken -resetPasswordExpires -authToken").lean();

    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, user });
  } catch (error: any) {
    console.error("❌ Admin update user error:", error);
    return NextResponse.json({ success: false, error: "Failed to update user" }, { status: 500 });
  }
}

// DELETE /api/admin/users/[id] — Delete user
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const user = await User.findByIdAndDelete(params.id);
    if (!user) {
      return NextResponse.json({ success: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: "User deleted" });
  } catch (error: any) {
    console.error("❌ Admin delete user error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete user" }, { status: 500 });
  }
}
