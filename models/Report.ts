import mongoose, { Schema, Model, Document } from "mongoose";

export interface IReport extends Document {
  reporterId: mongoose.Types.ObjectId;
  reportedId: mongoose.Types.ObjectId;
  reason: string;
  status: "pending" | "reviewed" | "resolved";
  createdAt: Date;
  updatedAt: Date;
}

const ReportSchema = new Schema<IReport>(
  {
    reporterId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    reportedId: {
      type: Schema.Types.ObjectId,
      required: true,
      index: true,
      // Ref is omitted because it could be a User or a SubDocument Character within a User
      // Depending on the application context, if they always report the top-level user, we can ref it later.
    },
    reason: {
      type: String,
      required: [true, "Report reason is required"],
      trim: true,
      maxlength: [1000, "Reason cannot exceed 1000 characters"],
    },
    status: {
      type: String,
      enum: ["pending", "reviewed", "resolved"],
      default: "pending",
      index: true,
    },
  },
  { timestamps: true }
);

const Report: Model<IReport> =
  mongoose.models.Report || mongoose.model<IReport>("Report", ReportSchema);

export default Report;
