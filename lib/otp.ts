import crypto from "crypto";

// In-memory OTP storage (replaces Redis for development)
const otpStore = new Map<string, { otp: string; expiry: number }>();

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function storeOTP(
  identifier: string,
  otp: string,
  expiryMinutes: number = 10
): Promise<void> {
  const expiry = Date.now() + expiryMinutes * 60 * 1000;
  otpStore.set(identifier, { otp, expiry });

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("💾 OTP STORED");
  console.log(`📍 Key: ${identifier}`);
  console.log(`🔢 OTP: ${otp}`);
  console.log(`⏰ Expires: ${new Date(expiry).toLocaleTimeString()}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");
}

export async function verifyOTP(
  identifier: string,
  otp: string
): Promise<boolean> {
  const stored = otpStore.get(identifier);

  if (!stored) {
    console.log(`❌ No OTP found for ${identifier}`);
    return false;
  }

  if (Date.now() > stored.expiry) {
    console.log(`❌ OTP expired for ${identifier}`);
    otpStore.delete(identifier);
    return false;
  }

  if (stored.otp === otp) {
    otpStore.delete(identifier);
    console.log(`✅ OTP verified for ${identifier}`);
    return true;
  }

  console.log(`❌ Invalid OTP for ${identifier}`);
  return false;
}

export async function resendOTP(identifier: string): Promise<string> {
  const newOTP = generateOTP();
  await storeOTP(identifier, newOTP);
  return newOTP;
}

// Auto-cleanup expired OTPs every minute
setInterval(() => {
  const now = Date.now();
  let cleaned = 0;
  for (const [key, value] of otpStore.entries()) {
    if (now > value.expiry) {
      otpStore.delete(key);
      cleaned++;
    }
  }
  if (cleaned > 0) {
    console.log(`🧹 Cleaned ${cleaned} expired OTPs`);
  }
}, 600000);
