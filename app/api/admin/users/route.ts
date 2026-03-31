import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { hashPassword } from "@/lib/auth";

// GET /api/admin/users — List all users with pagination and search
export async function GET(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";

    const query: any = { role: { $ne: "admin" } };
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { email: { $regex: search, $options: "i" } },
      ];
    }

    const [users, total] = await Promise.all([
      User.find(query)
        .select("name email avatar role createdAt characters followersCount followingCount")
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      User.countDocuments(query),
    ]);

    const usersWithCounts = users.map((u: any) => ({
      _id: u._id,
      name: u.name,
      email: u.email,
      avatar: u.avatar,
      role: u.role,
      createdAt: u.createdAt,
      characterCount: u.characters?.length || 0,
      followersCount: u.followersCount || 0,
      followingCount: u.followingCount || 0,
    }));

    return NextResponse.json({
      success: true,
      users: usersWithCounts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("❌ Admin list users error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch users" }, { status: 500 });
  }
}

// POST /api/admin/users — Create a new user
export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    await dbConnect();

    const body = await request.json();
    const { name, email, password, avatar } = body;

    if (!name || !email) {
      return NextResponse.json({ success: false, error: "Name and email are required" }, { status: 400 });
    }

    // Check if user already exists
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) {
      return NextResponse.json({ success: false, error: "Email already in use" }, { status: 409 });
    }

    const userData: any = {
      name,
      email: email.toLowerCase(),
      role: "user",
      isEmailVerified: true, // Admin-created users are pre-verified
      authProvider: "email",
    };

    if (password) {
      userData.password = await hashPassword(password);
    }

    if (avatar) {
      userData.avatar = avatar;
    }

    const user = await User.create(userData);

    return NextResponse.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        role: user.role,
        createdAt: user.createdAt,
      },
    }, { status: 201 });
  } catch (error: any) {
    console.error("❌ Admin create user error:", error);
    return NextResponse.json({ success: false, error: "Failed to create user" }, { status: 500 });
  }
}
