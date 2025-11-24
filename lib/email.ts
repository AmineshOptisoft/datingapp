import nodemailer from "nodemailer";

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;

// Create transporter with your credentials
const transporter =
  EMAIL_USER && EMAIL_PASS
    ? nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS,
      },
    })
    : null;

export async function sendEmailOTP(
  email: string,
  otp: string,
  type: string = "VERIFICATION"
): Promise<{ success: boolean; error?: any }> {
  // If no credentials, fall back to console
  if (!transporter) {
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL OTP (NO CREDENTIALS - MOCK)");
    console.log(`📧 To: ${email}`);
    console.log(`📋 Type: ${type}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
    return { success: true };
  }

  try {
    console.log(`📧 Sending email to ${email}...`);

    const info = await transporter.sendMail({
      from: `"Dating App 💖" <${EMAIL_USER}>`,
      to: email,
      subject: `Your ${type} Code - Dating App`,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { 
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                line-height: 1.6; 
                background-color: #f5f5f5;
                margin: 0;
                padding: 0;
              }
              .container { 
                max-width: 600px;
                margin: 20px auto; 
                background: white;
                border-radius: 16px;
                overflow: hidden;
                box-shadow: 0 4px 6px rgba(0,0,0,0.1);
              }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
              }
              .header h1 {
                margin: 0;
                font-size: 28px;
              }
              .content { 
                padding: 40px 30px; 
              }
              .otp-box {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                padding: 3px;
                border-radius: 12px;
                margin: 30px 0;
              }
              .otp-code { 
                background: white; 
                padding: 24px; 
                text-align: center; 
                font-size: 36px; 
                font-weight: bold; 
                color: #667eea; 
                letter-spacing: 10px; 
                border-radius: 10px;
                font-family: 'Courier New', monospace;
              }
              .info {
                background: #f9fafb;
                padding: 20px;
                border-radius: 8px;
                border-left: 4px solid #667eea;
                margin: 20px 0;
              }
              .footer { 
                text-align: center; 
                padding: 20px; 
                color: #6b7280; 
                font-size: 14px; 
                background: #f9fafb;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💖 Dating App</h1>
                <p style="margin: 10px 0 0 0; opacity: 0.9;">Verification Code</p>
              </div>
              <div class="content">
                <h2 style="color: #1f2937; margin-top: 0;">Hi there! 👋</h2>
                <p style="color: #4b5563; font-size: 16px;">
                  Thank you for joining our dating community. To complete your ${type.toLowerCase()}, 
                  please use the verification code below:
                </p>
                
                <div class="otp-box">
                  <div class="otp-code">${otp}</div>
                </div>
                
                <div class="info">
                  <p style="margin: 0; color: #374151;">
                    <strong>⏰ This code expires in 10 minutes</strong><br>
                    For security reasons, please do not share this code with anyone.
                  </p>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  If you didn't request this code, you can safely ignore this email. 
                  Someone might have entered your email address by mistake.
                </p>
              </div>
              <div class="footer">
                <p style="margin: 0;">© 2025 Dating App. All rights reserved.</p>
                <p style="margin: 10px 0 0 0; font-size: 12px;">
                  Questions? Contact us at support@datingapp.com
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
      // Plain text fallback
      text: `
        Your Dating App ${type} Code
        
        Your verification code is: ${otp}
        
        This code will expire in 10 minutes.
        
        If you didn't request this code, please ignore this email.
        
        © 2025 Dating App
      `,
    });

    console.log(`✅ Email sent successfully to ${email}`);
    console.log(`📬 Message ID: ${info.messageId}`);
    return { success: true };
  } catch (error: any) {
    console.error("❌ Email sending error:", error.message);

    // Log detailed error for debugging
    if (error.code === "EAUTH") {
      console.error(
        "⚠️ Authentication failed. Check your EMAIL_USER and EMAIL_PASS"
      );
      console.error(
        "⚠️ Make sure you are using an App Password, not your regular Gmail password"
      );
    }

    // Fall back to console for development
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.log("📧 EMAIL OTP (FALLBACK - Error occurred)");
    console.log(`📧 To: ${email}`);
    console.log(`🔢 OTP: ${otp}`);
    console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    return { success: false, error };
  }
}

export async function sendWelcomeEmail(email: string, name: string) {
  if (!transporter) {
    console.log(`📧 Welcome email to ${name} at ${email} (MOCK)\n`);
    return;
  }

  try {
    await transporter.sendMail({
      from: `"Dating App 💖" <${EMAIL_USER}>`,
      to: email,
      subject: "Welcome to Dating App! 💖",
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                color: white; 
                padding: 40px 30px; 
                text-align: center; 
                border-radius: 10px 10px 0 0;
              }
              .content { 
                background: #f9fafb; 
                padding: 40px 30px; 
                border-radius: 0 0 10px 10px;
              }
              .button {
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 14px 32px;
                text-decoration: none;
                border-radius: 8px;
                font-weight: 600;
                margin: 20px 0;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>Welcome ${name}! 💖</h1>
                <p>Your account is now fully verified and active</p>
              </div>
              <div class="content">
                <h2>You're all set!</h2>
                <p>Thank you for joining our dating community. Your profile is ready and you can start connecting with amazing people!</p>
                
                <p><strong>What's Next?</strong></p>
                <ul>
                  <li>Complete your profile</li>
                  <li>Upload your best photos</li>
                  <li>Start browsing matches</li>
                  <li>Send your first message</li>
                </ul>
                
                <div style="text-align: center;">
                  <a href="${process.env.NEXT_PUBLIC_APP_URL}/dashboard" class="button">
                    Go to Dashboard
                  </a>
                </div>
                
                <p style="color: #6b7280; font-size: 14px; margin-top: 30px;">
                  If you have any questions, feel free to reach out to our support team.
                </p>
              </div>
            </div>
          </body>
        </html>
      `,
    });

    console.log(`✅ Welcome email sent to ${name}`);
  } catch (error) {
    console.error("Welcome email error:", error);
  }
}
