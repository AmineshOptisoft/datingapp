import mongoose, { Schema, Document } from "mongoose";

export interface IPersona extends Document {
  userId: mongoose.Types.ObjectId;
  displayName: string;
  background?: string;
  avatar?: string;
  makeDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const PersonaSchema = new Schema<IPersona>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
      index: true,
    },
    displayName: {
      type: String,
      required: [true, "Display name is required"],
      trim: true,
      maxlength: [20, "Display name cannot exceed 20 characters"],
    },
    background: {
      type: String,
      trim: true,
      maxlength: [750, "Background cannot exceed 750 characters"],
      default: "",
    },
    avatar: {
      type: String,
      default: "",
    },
    makeDefault: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
PersonaSchema.index({ userId: 1, createdAt: -1 });

const Persona = mongoose.models.Persona || mongoose.model<IPersona>("Persona", PersonaSchema);

export default Persona;
