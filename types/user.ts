import { Document, Types } from "mongoose";

export interface ICharacter {
  _id?: Types.ObjectId;
  characterName: string;
  characterImage?: string;
  characterAge: number;
  characterGender: 'male' | 'female' | 'other';
  language: string;
  tags: string[];
  description: string;
  personality: string;
  scenario: string;
  firstMessage: string;
  visibility: 'public' | 'private';
  likes?: number;
  interactions?: number;
  likedBy?: string[];
  interactedBy?: string[];
  generatedImages?: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  phoneNumber?: string;
  password?: string;
  googleId?: string;
  authProvider?: 'email' | 'google';
  avatar?: string;
  bio?: string;
  role: 'user' | 'character' | 'admin';
  isEmailVerified: boolean;
  isPhoneVerified: boolean;
  profileComplete: boolean;
  createdAt: Date;
  updatedAt: Date;
  stripeCustomerId: string;
  characters?: ICharacter[];
  country?: string;
  preferredLanguage?: string;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  authToken?: string;
  followersCount?: number;
  followingCount?: number;
  lastActiveAt?: Date;
  inactivityNotificationSentAt?: Date | null;
  dailyInactivityCount?: number;
  shareCount?: number;
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
