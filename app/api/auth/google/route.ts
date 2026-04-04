
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

    // Verify Google Token - accept Web + Android (Firebase) Client IDs
    const audiences = [
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_ANDROID_CLIENT_ID, // Firebase Android Client ID
      process.env.GOOGLE_IOS_CLIENT_ID,     // Firebase iOS Client ID (if needed)
    ].filter(Boolean) as string[];

    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: audiences,
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

      // 🎁 Create wallet with 100 free coins for new Google user
      try {
        const { WalletService } = await import("@/lib/walletService");
        await WalletService.getWallet(user._id.toString());
        console.log(`✨ Wallet created for new Google user ${user._id} with 100 free coins`);
      } catch (walletError) {
        console.error("⚠️ Failed to create wallet for Google user:", walletError);
        // Don't fail login if wallet creation fails
      }

      // 👋 Send default welcome messages from random characters
      try {
        const { sendWelcomeMessages } = await import("@/lib/welcomeMessages");
        await sendWelcomeMessages(user._id.toString());
      } catch (welcomeError) {
        console.error("⚠️ Failed to send welcome messages:", welcomeError);
      }
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

    // 💾 Save token to DB so it can be retrieved later
    user.authToken = token;
    await user.save();

    // 🔐 Console log for testing
    console.log("\n========================================");
    console.log("✅ GOOGLE LOGIN SUCCESSFUL");
    console.log("========================================");
    console.log("📧 Email:", user.email);
    console.log("👤 Name:", user.name);
    console.log("🆔 User ID:", user._id.toString());
    console.log("🔑 Token:", token);
    console.log("📱 Profile Complete:", user.profileComplete);
    console.log("========================================\n");

    // 💰 Fetch wallet balance to include in response
    let walletBalance = 0;
    try {
      const { WalletService } = await import("@/lib/walletService");
      const wallet = await WalletService.getWallet(user._id.toString());
      walletBalance = wallet?.balance ?? 0;
    } catch {
      // wallet fetch fail hone pe 0 bhej do
    }

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
          profileComplete: user.profileComplete,
          shareCount: user.shareCount || 0
        },
        wallet: {
          balance: walletBalance,  // ← 100 coins naye user ke liye
        }
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
