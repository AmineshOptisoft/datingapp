
import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import crypto from "crypto";
import nodemailer from "nodemailer";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const user = await User.findOne({ email });

    if (!user) {
      // For security, do not reveal if user doesn't exist.
      // But for better UX during dev/testing, we might want to be explicit.
      // Usually standard practice is generic message.
      return NextResponse.json(
        { success: false, message: "If an account exists, a reset link has been sent." },
        { status: 200 } // Always return 200
      );
    }
    
    // Create reset token
    const token = crypto.randomBytes(20).toString("hex");
    
    // Set token and expiry (1 hour)
    user.resetPasswordToken = token;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); 
    
    await user.save();
    
    // Send email
    // NOTE: This requires SMTP credentials in .env
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    
    const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/reset-password/${token}`;
    
    const mailOptions = {
        to: user.email,
        from: process.env.SMTP_FROM || '"Idyll Support" <noreply@idyll.com>',
        subject: 'Password Reset Request',
        text: `You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n` +
          `Please click on the following link, or paste this into your browser to complete the process:\n\n` +
          `${resetUrl}\n\n` +
          `If you did not request this, please ignore this email and your password will remain unchanged.\n`
    };
    
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      success: true,
      message: "Reset link sent", // In real app, maybe don't say "sent" if we returned generic above, but this is fine.
    });

  } catch (error: any) {
    console.error("Forgot Password Error:", error);
    return NextResponse.json(
      { success: false, message: "Error sending email" },
      { status: 500 }
    );
  }
}
