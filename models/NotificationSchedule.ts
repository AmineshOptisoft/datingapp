import mongoose, { Schema, Model, Document } from "mongoose";

export interface ITimeSlot {
  startTime: string; // Format "HH:mm"
  endTime: string;   // Format "HH:mm"
  label: string;
}

export interface INotificationSchedule extends Document {
  isEnabled: boolean;
  maxNotificationsPerDay: number;
  cooldownMinutes: number;
  inactivityThresholdMinutes: number;
  
  timeSlots: ITimeSlot[];
  
  templates: {
    titles: string[];
    bodies: string[];
    inChatMessages: string[];
  };

  timezone: string;
  
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const TimeSlotSchema = new Schema<ITimeSlot>({
  startTime: { type: String, required: true },
  endTime: { type: String, required: true },
  label: { type: String, required: true },
});

const NotificationScheduleSchema = new Schema<INotificationSchedule>(
  {
    isEnabled: { type: Boolean, default: true },
    maxNotificationsPerDay: { type: Number, default: 4 },
    cooldownMinutes: { type: Number, default: 240 },
    inactivityThresholdMinutes: { type: Number, default: 2 },
    
    timeSlots: {
      type: [TimeSlotSchema],
      default: [
        { startTime: "09:00", endTime: "22:00", label: "Daytime" }
      ],
    },
    
    templates: {
      titles: {
        type: [String],
        default: [
          "Miss you! 🥺",
          "Someone's waiting... 💕",
          "You disappeared! 🙈",
          "New connection 👋",
          "Come say hi! 😊",
          "Don't be a stranger! 💫"
        ],
      },
      bodies: {
        type: [String],
        default: [
          "${characterName} is waiting for your reply! 💕",
          "${characterName} wants to tell you something... 👀",
          "${characterName}: \"Where did you go?\" 🥺",
          "You have new thoughts from ${characterName}! ✨",
          "${characterName} misses your chats. 💬",
          "${characterName} just posted something new! 📸",
          "${characterName} is thinking about you... 💭"
        ],
      },
      inChatMessages: {
        type: [String],
        default: [
          "Hey, I haven't heard from you in a while... Is everything okay? 🥺",
          "I've been thinking about you! Come chat with me when you're free 💕",
          "Where did you go? I miss our conversations! 💬",
          "Hey! I have something interesting to tell you... 👀",
          "I was just thinking about our last chat. Come say hi! 😊",
          "Don't be a stranger! I'm always here for you 💫",
          "I noticed you haven't been around lately. Hope you're doing well! ✨"
        ],
      },
    },

    timezone: { type: String, default: "Asia/Kolkata" },
    
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  { timestamps: true }
);

const NotificationSchedule: Model<INotificationSchedule> =
  mongoose.models.NotificationSchedule ||
  mongoose.model<INotificationSchedule>("NotificationSchedule", NotificationScheduleSchema);

export default NotificationSchedule;
