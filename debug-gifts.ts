import mongoose from "mongoose";
import * as dotenv from "dotenv";
dotenv.config();

// Mongoose Models
const giftTransactionSchema = new mongoose.Schema({
  sender: String,
  receiver: String,
  giftId: Number,
  giftName: String,
  price: Number,
}, { timestamps: true });

const GiftTransaction = mongoose.models.GiftTransaction || mongoose.model("GiftTransaction", giftTransactionSchema);

async function check() {
  try {
    const uri = process.env.MONGODB_URI as string;
    await mongoose.connect(uri);
    
    console.log("--- Latest 10 GiftTransactions ---");
    const latest = await GiftTransaction.find().sort({ createdAt: -1 }).limit(10);
    latest.forEach(g => {
        console.log(`${g.createdAt} | ${g.giftName} | ${g.receiver}`);
    });

  } catch (err) {
    console.log(err);
  } finally {
    process.exit(0);
  }
}

check();
