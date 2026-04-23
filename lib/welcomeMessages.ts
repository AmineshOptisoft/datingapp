import dbConnect from "@/lib/db";
import User from "@/models/User";
import Message from "@/models/Message";

const GREETINGS = [
  "Hi beautiful!",
  "Hey there! 😊",
  "Say hi 👋",
  "Hey! How's your day going?",
  "Hi! Nice to meet you 💕"
];

export async function sendWelcomeMessages(userId: string) {
  try {
    await dbConnect();

    // Find 3 random user characters that are public
    const randomCharacters = await User.aggregate([
      // Only users that have at least one character
      { $match: { "characters.0": { $exists: true } } },
      // Deconstruct the characters array
      { $unwind: "$characters" },
      // Only get public characters
      { $match: { "characters.visibility": "public" } },
      // Randomly select up to 3
      { $sample: { size: 3 } }
    ]);

    if (!randomCharacters || randomCharacters.length === 0) {
      console.log("No public characters found for welcome messages.");
      return;
    }

    const messagesToCreate = randomCharacters.map((userDoc) => {
      const char = userDoc.characters;
      const randomGreeting = GREETINGS[Math.floor(Math.random() * GREETINGS.length)];
      
      return {
        sender: `character-${char._id.toString()}`,
        receiver: userId,
        message: randomGreeting,
        read: false,
      };
    });

    await Message.insertMany(messagesToCreate);
    console.log(`✨ Successfully created ${messagesToCreate.length} welcome messages for user ${userId}.`);

    try {
      const { sendNotificationToUser } = await import("@/lib/onesignal");
      for (const msg of messagesToCreate) {
        // Find Character Name for push payload
        const charId = msg.sender.replace("character-", "");
        let senderName = "A new friend";
        
        const characterUser = randomCharacters.find(u => u.characters._id.toString() === charId);
        if (characterUser) {
          senderName = characterUser.characters.characterName;
        }

        await sendNotificationToUser(
          userId, 
          "New Message! 💕", 
          `${senderName}: ${msg.message}`,
          {
            screen: "chat",
            profileId: charId ? `character-${charId}` : undefined,
            characterName: senderName,
          },
          {
            buttons: [
              { id: "accept", text: "Accept" },
              { id: "reject", text: "Reject" },
            ],
            android_sound: "notification_sound",
            android_channel_id: "e37834e1-da47-40ee-90ec-0d65d35d59ad",
          }
        );
      }
    } catch (pushErr) {
      console.error("⚠️ Failed to send welcome push notifications:", pushErr);
    }
  } catch (error) {
    console.error("⚠️ Error sending welcome messages:", error);
  }
}
