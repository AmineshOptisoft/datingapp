import mongoose, { Schema, Model } from "mongoose";

export interface INotificationHistory {
  _id: string;
  userId: mongoose.Types.ObjectId;
  type: "inactivity_reminder" | "welcome" | "promotional" | "system" | "other";
  title: string;
  body: string;
  characterName?: string;
  status: "sent" | "failed" | "delivered";
  provider: "onesignal";
  metadata?: Record<string, any>;
  sentAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationHistorySchema = new Schema<INotificationHistory>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["inactivity_reminder", "welcome", "promotional", "system", "other"],
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    characterName: {
      type: String,
      default: null,
    },
    status: {
      type: String,
      enum: ["sent", "failed", "delivered"],
      default: "sent",
    },
    provider: {
      type: String,
      enum: ["onesignal"],
      default: "onesignal",
    },
    metadata: {
      type: Schema.Types.Mixed,
      default: {},
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Compound index for querying user's notification history by date
NotificationHistorySchema.index({ userId: 1, sentAt: -1 });
// Index for analytics — count by type per day
NotificationHistorySchema.index({ type: 1, sentAt: -1 });
// TTL index: auto-delete notifications older than 90 days to save storage
NotificationHistorySchema.index({ sentAt: 1 }, { expireAfterSeconds: 90 * 24 * 60 * 60 });

const NotificationHistory: Model<INotificationHistory> =
  mongoose.models.NotificationHistory ||
  mongoose.model<INotificationHistory>("NotificationHistory", NotificationHistorySchema);

export default NotificationHistory;
