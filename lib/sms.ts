// Mock SMS service for development (no Twilio needed)

export async function sendSMSOTP(
  phoneNumber: string,
  otp: string,
  type: string = "VERIFICATION"
): Promise<{ success: boolean; error?: any }> {
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
  console.log("📱 SMS OTP (MOCK)");
  console.log(`📞 To: ${phoneNumber}`);
  console.log(`📋 Type: ${type}`);
  console.log(`🔢 OTP: ${otp}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

  return { success: true };
}

export async function sendWelcomeSMS(phoneNumber: string, name: string) {
  console.log(`📱 Welcome SMS: Hello ${name}! (to ${phoneNumber})\n`);
}
