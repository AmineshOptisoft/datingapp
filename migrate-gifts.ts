import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

// Mongoose Models
const messageSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  message: String,
}, { timestamps: true });

const Message = mongoose.models.Message || mongoose.model("Message", messageSchema);

const giftTransactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  giftId: Number,
  giftName: String,
  price: Number,
}, { timestamps: true });

const GiftTransaction = mongoose.models.GiftTransaction || mongoose.model("GiftTransaction", giftTransactionSchema);

const uri = process.env.MONGODB_URI as string;

async function run() {
  if (!uri) {
    console.error("No MONGODB_URI found. Exiting...");
    process.exit(1);
  }

  try {
    await mongoose.connect(uri);
    console.log("Connected to MongoDB.");

    const gifts = await Message.find({ message: { $regex: '^🎁 Sent ', $options: 'i' } });
    console.log(`Found ${gifts.length} existing gifts in Message collection.`);

    let count = 0;
    for (const msg of gifts) {
      if (!msg.message) continue;
      const match = msg.message.match(/🎁 Sent (.+) \((\d+) coins\)/i);
      if (match) {
        const giftName = match[1];
        const price = parseInt(match[2], 10);
        
        // Prevent duplicates
        const existing = await GiftTransaction.findOne({ 
          createdAt: msg.createdAt, 
          sender: msg.sender, 
          receiver: msg.receiver 
        });
        
        if (!existing) {
          await GiftTransaction.create({
            sender: msg.sender,
            receiver: msg.receiver,
            giftId: 0, // Migrated legacy gifts don't have accurate giftId saved in chat text, mapping by name later
            giftName: giftName,
            price: price,
            createdAt: msg.createdAt, // Preserve original date
            updatedAt: msg.updatedAt
          });
          count++;
        }
      }
    }
    console.log(`Successfully migrated ${count} new gifts to GiftTransaction collection.`);
  } catch (error) {
    console.error("Migration Error:", error);
  } finally {
    mongoose.disconnect();
    process.exit(0);
  }
}

run();
