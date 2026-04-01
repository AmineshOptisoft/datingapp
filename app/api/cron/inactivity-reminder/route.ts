import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Message from "@/models/Message";
import AIProfile from "@/models/AIProfile";
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

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    // === 🛠️ SETTINGS ===
    // 1. Inactive for 1 hour
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    // 2. Cooldown between the daily pushes (Production: 4 hours)
    const cooldownMinutesAgo = new Date(now.getTime() - 240 * 60 * 1000);

    // 1. Reset daily counts automatically if their last notification was before today!
    await User.updateMany(
      { inactivityNotificationSentAt: { $lt: startOfToday } },
      { $set: { dailyInactivityCount: 0 } }
    );

    // 2. Find inactive users
    const inactiveUsers = await User.find({
      lastActiveAt: { $lt: oneHourAgo },
      $and: [
        {
          $or: [
            { dailyInactivityCount: { $exists: false } },
            { dailyInactivityCount: { $lt: 15 } } // Limit to 15 times per day!
          ]
        },
        {
          $or: [
            { inactivityNotificationSentAt: null },
            // Only send if they became active AFTER we sent the last notification!
            { $expr: { $gt: ["$lastActiveAt", "$inactivityNotificationSentAt"] } }
          ]
        }
      ]
    }).select("_id name dailyInactivityCount");

    if (!inactiveUsers || inactiveUsers.length === 0) {
      return NextResponse.json({ success: true, message: "No inactive users to notify." });
    }

    let notifiedCount = 0;

    // 2. Process each user
    for (const user of inactiveUsers) {
      try {
        // Find their most recent message to identify their favorite/recent character
        const lastMessage = await Message.findOne({
          $or: [{ sender: user._id.toString() }, { receiver: user._id.toString() }],
        }).sort({ createdAt: -1 });

        let characterName = "Your AI companions";
        let messageBody = "We're missing you! Come back and let's chat.";

        let pushTitle = "Miss you! 🥺";

        if (lastMessage) {
          // Identify if the other participant was a character/AI
          const otherId = lastMessage.sender === user._id.toString() ? lastMessage.receiver : lastMessage.sender;

          // Safely check what kind of participant they spoke to
          if (otherId.startsWith("character-")) {
            const charObjId = otherId.replace("character-", "");
            // Attempt to fetch name of User's created character
            const ownerUser = await User.findOne({ "characters._id": charObjId });
            const charData = ownerUser?.characters?.find((c: any) => c._id.toString() === charObjId);
            if (charData) {
              characterName = charData.characterName;
            }
          } else {
            // It might be a system AIProfile. 
            // Only search by _id if it's a valid 24-char hex string to prevent Mongoose CastErrors!
            const mongoose = require("mongoose");
            const isValidObjectId = mongoose.Types.ObjectId.isValid(otherId);
            
            const query = isValidObjectId 
              ? { $or: [{ _id: otherId }, { profileId: otherId }] }
              : { profileId: otherId };

            const aiProfile = await AIProfile.findOne(query);
            if (aiProfile) {
              characterName = aiProfile.name;
            }
          }

          if (characterName !== "Your AI companions") {
            const dynamicMessages = [
              `${characterName} is waiting for your reply! 💕`,
              `${characterName} wants to tell you something... 👀`,
              `${characterName}: "Where did you go?" 🥺`,
              `You have new thoughts from ${characterName}! ✨`,
              `${characterName} misses your chats. 💬`
            ];
            const dynamicTitles = [
              "Miss you! 🥺",
              "Someone's waiting... 💕",
              "You disappeared! 🙈",
              "New connection 👋"
            ];
            
            messageBody = dynamicMessages[Math.floor(Math.random() * dynamicMessages.length)];
            pushTitle = dynamicTitles[Math.floor(Math.random() * dynamicTitles.length)];
          }
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

        if (pushSuccess) {
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
