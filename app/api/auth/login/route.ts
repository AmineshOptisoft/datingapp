import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, generateToken } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });
    if (!user)
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );
    if (!user.isEmailVerified)
      return NextResponse.json(
        { success: false, message: "Email not verified" },
        { status: 403 }
      );

    // If user has no password (e.g. Google-only account), they cannot login with password
    if (!user.password) {
       return NextResponse.json(
        { success: false, message: "Please log in with Google" },
        { status: 400 }
      );
    }

    const validPass = await verifyPassword(password, user.password);
    if (!validPass)
      return NextResponse.json(
        { success: false, message: "Invalid credentials" },
        { status: 401 }
      );

    const token = generateToken(user._id.toString());

    return NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
        },
      },
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
