import mongoose, { Schema, Document } from "mongoose";

export interface IGiftTransaction extends Document {
  sender: string;
  receiver: string;
  giftId: number;
  giftName: string;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

const GiftTransactionSchema = new Schema<IGiftTransaction>(
  {
    sender: {
      type: String, // Kept String to match how sender is stored in Message model (ObjectId stored as String)
      required: true,
      ref: "User",
    },
    receiver: {
      type: String,
      required: true,
    },
    giftId: {
      type: Number,
      required: true,
    },
    giftName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

const GiftTransaction = mongoose.models.GiftTransaction || mongoose.model<IGiftTransaction>("GiftTransaction", GiftTransactionSchema);

export default GiftTransaction;
