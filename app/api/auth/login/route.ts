import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { verifyPassword, generateToken, hashPassword } from "@/lib/auth";

// ─── Static Admin Credentials ─────────────────────────────────────────────────
const ADMIN_EMAIL = "admin123@gmail.com";
const ADMIN_PASSWORD = "12345678";

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

    // ─── Admin Login Flow ────────────────────────────────────────────────
    if (email.toLowerCase() === ADMIN_EMAIL) {
      if (password !== ADMIN_PASSWORD) {
        return NextResponse.json(
          { success: false, message: "Invalid credentials" },
          { status: 401 }
        );
      }

      // Auto-create admin user if doesn't exist
      let adminUser = await User.findOne({ email: ADMIN_EMAIL });
      if (!adminUser) {
        const hashed = await hashPassword(ADMIN_PASSWORD);
        adminUser = await User.create({
          name: "Admin",
          email: ADMIN_EMAIL,
          password: hashed,
          role: "admin",
          isEmailVerified: true,
          authProvider: "email",
        });
        console.log("🛡️ Admin user auto-created");
      } else if (adminUser.role !== "admin") {
        // Ensure role is admin if user exists but role was wrong
        adminUser.role = "admin" as any;
        await adminUser.save();
      }

      const token = generateToken(adminUser._id.toString());

      const response = NextResponse.json({
        success: true,
        message: "Login successful",
        token,
        data: {
          user: {
            id: adminUser._id,
            name: adminUser.name,
            email: adminUser.email,
            avatar: adminUser.avatar,
            role: "admin",
            shareCount: adminUser.shareCount || 0,
          },
        },
      });

      response.cookies.set("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7,
        path: "/",
      });

      return response;
    }

    // ─── Regular User Login Flow ─────────────────────────────────────────
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

    const response = NextResponse.json({
      success: true,
      message: "Login successful",
      token,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          role: user.role || "user",
          shareCount: user.shareCount || 0,
        },
      },
    });

    // 🍪 Set the token in an HttpOnly cookie
    response.cookies.set("token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Login failed" },
      { status: 500 }
    );
  }
}
