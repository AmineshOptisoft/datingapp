import { Document, Types } from "mongoose";

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber: string;
  password: string;
  avatar?: string;
  bio?: string;
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
