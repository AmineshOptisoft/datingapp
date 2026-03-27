import mongoose, { Schema, Model, Document, Types } from "mongoose";

export interface IBlock extends Document {
  blockerId: mongoose.Types.ObjectId;
  blockedId: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const BlockSchema = new Schema<IBlock>(
  {
    blockerId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    blockedId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

// Prevent duplicate blocks
BlockSchema.index({ blockerId: 1, blockedId: 1 }, { unique: true });

const Block: Model<IBlock> =
  mongoose.models.Block || mongoose.model<IBlock>("Block", BlockSchema);

export default Block;
