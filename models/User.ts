import mongoose, { Schema, Model } from "mongoose";
import { IUser, ICharacter } from "@/types/user";

const CharacterSchema = new Schema<ICharacter>(
  {
    characterName: {
      type: String,
      required: [true, "Character name is required"],
      trim: true,
      maxlength: [100, "Character name cannot exceed 100 characters"],
    },
    characterImage: {
      type: String,
      default: null,
    },
    characterAge: {
      type: Number,
      required: [true, "Character age is required"],
      min: [18, "Character must be at least 18 years old"],
      max: [150, "Character age cannot exceed 150"],
    },
    characterGender: {
      type: String,
      enum: ["male", "female", "other"],
      required: [true, "Character gender is required"],
    },
    language: {
      type: String,
      default: "English",
      trim: true,
    },
    tags: {
      type: [String],
      default: [],
      validate: {
        validator: function(tags: string[]) {
          return tags.length <= 10;
        },
        message: "Cannot add more than 10 tags",
      },
    },
    description: {
      type: String,
      required: [true, "Description is required"],
      maxlength: [1000, "Description cannot exceed 1000 characters"],
    },
    personality: {
      type: String,
      required: [true, "Personality is required"],
      maxlength: [1000, "Personality cannot exceed 1000 characters"],
    },
    scenario: {
      type: String,
      required: [true, "Scenario is required"],
      maxlength: [1000, "Scenario cannot exceed 1000 characters"],
    },
    firstMessage: {
      type: String,
      required: [true, "First message is required"],
      maxlength: [1000, "First message cannot exceed 1000 characters"],
    },
    visibility: {
      type: String,
      enum: ["public", "private"],
      default: "private",
    },
  },
  { timestamps: true }
);

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [50, "Name cannot exceed 50 characters"],
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [
        /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
        "Please enter a valid email",
      ],
    },
    phoneNumber: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
      match: [/^\+?[1-9]\d{1,14}$/, "Please enter a valid phone number"],
    },
    password: {
      type: String,
      required: function() {
        // @ts-ignore
        return this.authProvider === 'email';
      },
      minlength: [6, "Password must be at least 6 characters"],
    },
    avatar: {
      type: String,
      default: null,
    },
    bio: {
      type: String,
      default: "",
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    role: {
      type: String,
      enum: ["user", "character"],
      default: "user",
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    isPhoneVerified: {
      type: Boolean,
      default: false,
    },
    profileComplete: {
      type: Boolean,
      default: false,
    },
    stripeCustomerId: {
      type: String,
      default: null,
    },
    characters: {
      type: [CharacterSchema],
      default: [],
    },
    googleId: {
      type: String,
      unique: true,
      sparse: true,
    },
    authProvider: {
      type: String,
      enum: ["email", "google"],
      default: "email",
    },
    resetPasswordToken: {
      type: String,
      default: undefined,
    },
    resetPasswordExpires: {
      type: Date,
      default: undefined,
    },
  },
  { timestamps: true }
);

const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
