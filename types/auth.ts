export interface OTPVerification {
  identifier: string;
  otp: string;
}

export interface AuthResponse {
  success: boolean;
  message: string;
  data?: any;
}

export interface JWTPayload {
  userId: string;
  email: string;
}
