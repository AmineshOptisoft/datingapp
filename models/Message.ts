import mongoose, { Schema, Model } from "mongoose";

export interface IMessage {
  _id: string;
  sender: string;
  receiver: string;
  message: string;
  read: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const MessageSchema = new Schema<IMessage>(
  {
    sender: {
      type: String,
      required: true,
      ref: "User",
    },
    receiver: {
      type: String,
      required: true,
      ref: "User",
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
MessageSchema.index({ sender: 1, receiver: 1, createdAt: -1 });

const Message: Model<IMessage> =
  mongoose.models.Message || mongoose.model<IMessage>("Message", MessageSchema);

export default Message;
