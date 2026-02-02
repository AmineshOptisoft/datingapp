
import { NextRequest, NextResponse } from "next/server";
import { OAuth2Client } from "google-auth-library";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { generateToken } from "@/lib/auth";

const client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET
);

export async function POST(request: NextRequest) {
  try {
    const { credential } = await request.json();

    if (!credential) {
      return NextResponse.json(
        { success: false, message: "No credential provided" },
        { status: 400 }
      );
    }

    // Verify Google Token
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 400 }
      );
    }

    const { email, sub: googleId, name, picture } = payload;

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email not found in Google account" },
        { status: 400 }
      );
    }

    await dbConnect();

    // Check if user exists
    let user = await User.findOne({ email });

    if (!user) {
        // Create new user
        // Note: For Google users, we might not have phoneNumber immediately.
        // If your app STRICTLY requires it elsewhere, you might need a flow to ask for it.
        // For now, we assume schema allows optional phone.
      user = await User.create({
        name: name || "Google User",
        email: email,
        googleId: googleId,
        authProvider: "google",
        avatar: picture,
        isEmailVerified: true, // Google emails are verified
        profileComplete: false, // You might prompt for more info
      });
    } else {
        // If user exists but no googleId (legacy email user or first time google login with same email), update it
        if (!user.googleId) {
            user.googleId = googleId;
            user.authProvider = "google"; // Or keep as email, but link google. Usually linking is better.
            if (!user.avatar && picture) user.avatar = picture;
             // Ensure verified since they logged in with Google
            if(!user.isEmailVerified) user.isEmailVerified = true;
            await user.save();
        }
    }

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
          profileComplete: user.profileComplete
        },
      },
    });

  } catch (error: any) {
    console.error("Google Login Error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Google Login failed" },
      { status: 500 }
    );
  }
}
