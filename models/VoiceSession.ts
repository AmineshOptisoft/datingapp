import mongoose, { Schema, Model } from "mongoose";

interface VoiceMessage {
  role: "user" | "assistant";
  content: string;
  createdAt?: Date;
}

export interface IVoiceSession {
  _id: string;
  userId: string;
  profileId: string;
  messages: VoiceMessage[];
  createdAt: Date;
  updatedAt: Date;
}

const VoiceMessageSchema = new Schema<VoiceMessage>(
  {
    role: {
      type: String,
      enum: ["user", "assistant"],
      required: true,
    },
    content: {
      type: String,
      required: true,
      trim: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  { _id: false }
);

const VoiceSessionSchema = new Schema<IVoiceSession>(
  {
    userId: {
      type: String,
      required: true,
      index: true,
    },
    profileId: {
      type: String,
      required: true,
      index: true,
    },
    messages: {
      type: [VoiceMessageSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

VoiceSessionSchema.index({ userId: 1, profileId: 1 }, { unique: true });

const VoiceSession: Model<IVoiceSession> =
  mongoose.models.VoiceSession ||
  mongoose.model<IVoiceSession>("VoiceSession", VoiceSessionSchema);

export default VoiceSession;

