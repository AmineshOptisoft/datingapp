import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Message from "@/models/Message";
import NotificationHistory from "@/models/NotificationHistory";
import NotificationSchedule from "@/models/NotificationSchedule";
import { sendNotificationToUser } from "@/lib/onesignal";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    // Basic security for the cron endpoint (optional: verify a secret header)
    const authHeader = request.headers.get("authorization");
    if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // In production, require CRON_SECRET for security
      // return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
    }

    await dbConnect();

    // Fetch config
    let schedule = await NotificationSchedule.findOne({});
    if (!schedule) {
      // Fallback defaults
      schedule = {
        isEnabled: true,
        maxNotificationsPerDay: 4,
        cooldownMinutes: 240,
        inactivityThresholdMinutes: 2,
        timeSlots: [],
        templates: {
          titles: ["Miss you! 🥺", "Someone's waiting... 💕", "You disappeared! 🙈", "New connection 👋", "Come say hi! 😊", "Don't be a stranger! 💫"],
          bodies: ["${characterName} is waiting for your reply! 💕", "${characterName} wants to tell you something... 👀", "${characterName}: \"Where did you go?\" 🥺", "You have new thoughts from ${characterName}! ✨", "${characterName} misses your chats. 💬", "${characterName} just posted something new! 📸", "${characterName} is thinking about you... 💭"],
          inChatMessages: ["Hey, I haven't heard from you in a while... Is everything okay? 🥺", "I've been thinking about you! Come chat with me when you're free 💕", "Where did you go? I miss our conversations! 💬", "Hey! I have something interesting to tell you... 👀", "I was just thinking about our last chat. Come say hi! 😊", "Don't be a stranger! I'm always here for you 💫", "I noticed you haven't been around lately. Hope you're doing well! ✨"]
        },
        timezone: "Asia/Kolkata"
      } as any;
    }

    if (!schedule!.isEnabled) {  
      return NextResponse.json({ success: true, message: "Notification system is disabled by admin." });
    }

    const now = new Date();

    // Time Slot Check
    if (schedule!.timeSlots && schedule!.timeSlots.length > 0) {
      // Get current hours and mins in the target timezone
      const formatter = new Intl.DateTimeFormat('en-US', {
        timeZone: schedule!.timezone || 'Asia/Kolkata',
        hour: 'numeric',
        minute: 'numeric',
        hourCycle: 'h23'
      });
      const parts = formatter.formatToParts(now);
      const currentHour = parseInt(parts.find(p => p.type === 'hour')?.value || '0', 10);
      const currentMinute = parseInt(parts.find(p => p.type === 'minute')?.value || '0', 10);
      const currentTimeStr = `${currentHour.toString().padStart(2, '0')}:${currentMinute.toString().padStart(2, '0')}`;
      
      let isWithinSlot = false;
      for (const slot of schedule!.timeSlots) {
        if (currentTimeStr >= slot.startTime && currentTimeStr <= slot.endTime) {
          isWithinSlot = true;
          break;
        }
      }

      console.log("[CRON TIME CHECK] Current time:", currentTimeStr, "Allowed slots:", schedule!.timeSlots);

      if (!isWithinSlot) {
        return NextResponse.json({ success: true, message: "Current time is outside of allowed time slots." });
      }
    }

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // Settings
    const inactivityLimit = new Date(now.getTime() - (schedule!.inactivityThresholdMinutes * 60 * 1000));

    // 1. Reset daily counts automatically if their last notification was before today!
    await User.updateMany(
      { inactivityNotificationSentAt: { $lt: startOfToday } },
      { $set: { dailyInactivityCount: 0 } }
    );

    // 2. Find inactive users
    const inactiveUsers = await User.find({
      lastActiveAt: { $lt: inactivityLimit },
      $and: [
        {
          $or: [
            { dailyInactivityCount: { $exists: false } },
            { dailyInactivityCount: { $lt: schedule!.maxNotificationsPerDay } }
          ]
        },
        {
          $or: [
            { inactivityNotificationSentAt: null },
            // Cooldown check
            { inactivityNotificationSentAt: { $lt: new Date(now.getTime() - (schedule!.cooldownMinutes * 60 * 1000)) } },
            // Also Only send if they became active AFTER we sent the last notification!
            { $expr: { $gt: ["$lastActiveAt", "$inactivityNotificationSentAt"] } }
          ]
        }
      ]
    }).select("_id name dailyInactivityCount");

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No inactive users to notify." });
    }

    let notifiedCount = 0;

    // Pre-fetch all user-created characters (name + _id for message sender ID)
    const usersWithChars = await User.find(
      { "characters.0": { $exists: true } }
    ).select("characters._id characters.characterName").lean();
    
    const allCharacters: { characterId: string; characterName: string }[] = [];
    for (const u of usersWithChars) {
      const chars = (u as any).characters || [];
      for (const c of chars) {
        if (c.characterName && c._id) {
          allCharacters.push({
            characterId: c._id.toString(),
            characterName: c.characterName,
          });
        }
      }
    }

    for (const user of inactiveUsers) {
      try {
        let characterName = "Your AI companions";
        let characterId = "";
        let messageBody = "We're missing you! Come back and let's chat.";
        let pushTitle = "Miss you! 🥺";

        // Pick a random character from ALL user-created characters
        if (allCharacters.length > 0) {
          const picked = allCharacters[Math.floor(Math.random() * allCharacters.length)];
          characterName = picked.characterName;
          characterId = picked.characterId;
        }

        if (characterName !== "Your AI companions") {
          const dynamicMessages = schedule!.templates.bodies;
          const dynamicTitles = schedule!.templates.titles;
          
          let rawMessage = dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)] || "${characterName} is waiting!";
          messageBody = rawMessage.replace(/\$\{characterName\}/g, characterName);
          pushTitle = dynamicTitles[Math.floor(Math.random() * dynamicTitles.length)] || "Miss you! 🥺";
        }

        // 🛠️ TESTING: Console log the exact notification before sending
        console.log(`\n🚀 [CRON] Sending Push to User ${user._id} (${user.name || 'Unknown'}):`);
        console.log(`   Title: ${pushTitle}`);
        console.log(`   Body:  ${messageBody}\n`);

        // Send push
        const pushSuccess = await sendNotificationToUser(
          user._id.toString(),
          pushTitle,
          messageBody
        );

        // Save notification history (both success & failure)
        await NotificationHistory.create({
          userId: user._id,
          type: "inactivity_reminder",
          title: pushTitle,
          body: messageBody,
          characterName: characterName !== "Your AI companions" ? characterName : undefined,
          status: pushSuccess ? "sent" : "failed",
          provider: "onesignal",
          sentAt: new Date(),
        });

        if (pushSuccess) {
          // Also save an in-chat message from this character so it appears in the messages section
          if (characterId) {
            const inChatMessages = schedule!.templates.inChatMessages || ["Where did you go? I miss our conversations! 💬"];
            const chatMessage = inChatMessages[Math.floor(Math.random() * inChatMessages.length)];

            await Message.create({
              sender: `character-${characterId}`,
              receiver: user._id.toString(),
              message: chatMessage,
              read: false,
            });

            console.log(`💬 [CRON] In-chat message saved from character-${characterId} to user ${user._id}`);
          }

          // Update timestamp and increment their daily count
          const currentCount = user.dailyInactivityCount || 0;
          await User.findByIdAndUpdate(user._id, {
            inactivityNotificationSentAt: new Date(),
            dailyInactivityCount: currentCount + 1,
          });
          notifiedCount++;
        }
      } catch (err) {
        console.error(`❌ Failed to process cron notification for user ${user._id}:`, err);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Cron completed. Notified ${notifiedCount} users.`,
    });
  } catch (error: any) {
    console.error("❌ Cron Job Error:", error);
    return NextResponse.json(
      { success: false, message: "Cron Job Failed" },
      { status: 500 }
    );
  }
}
