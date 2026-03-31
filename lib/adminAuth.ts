import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import dbConnect from "@/lib/db";
import User from "@/models/User";

/**
 * Verify that the request is from an authenticated admin user.
 * Returns the admin user document on success, or a NextResponse error on failure.
 */
export async function verifyAdmin(request: NextRequest): Promise<{ adminUser: any } | NextResponse> {
  const authHeader = request.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const decoded = verifyToken(token);
  if (!decoded) {
    return NextResponse.json({ success: false, error: "Invalid token" }, { status: 401 });
  }

  await dbConnect();

  const adminUser = await User.findById(decoded.userId).lean();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ success: false, error: "Admin access required" }, { status: 403 });
  }

  return { adminUser };
}
