export function validateEmail(email: string): boolean {
  const regex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return regex.test(email);
}

export function validatePhone(phone: string): boolean {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(phone);
}

export function validatePassword(password: string): {
  valid: boolean;
  message?: string;
} {
  if (password.length < 6) {
    return { valid: false, message: "Password must be at least 6 characters" };
  }
  if (password.length > 50) {
    return { valid: false, message: "Password is too long" };
  }
  return { valid: true };
}

export function validateOTP(otp: string): boolean {
  return /^\d{6}$/.test(otp);
}
