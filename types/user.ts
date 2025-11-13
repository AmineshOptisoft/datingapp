export interface IUser {
  _id: string;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserRegistrationData {
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
}

export interface UserLoginData {
  email: string;
  password: string;
}
