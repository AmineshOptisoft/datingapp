import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  "mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app";

// ───────────────────────────────────────────────
// Config
// Zara-Knight
const CHARACTER_ID = "69c2878ddc6338c9787e6082";
const VIDEO_URL =
  "https://imagine-public.x.ai/imagine-public/share-videos/f214cd8c-052a-4f0d-98b7-ba38c873b371.mp4";
// ───────────────────────────────────────────────

const client = new MongoClient(MONGODB_URI);

async function main() {
  await client.connect();
  console.log("✅ Connected to MongoDB");

  const db = client.db("dating-app");

  // Find the user who owns this character
  const usersCol = db.collection("users");
  const user = await usersCol.findOne({
    "characters._id": new ObjectId(CHARACTER_ID),
  });

  if (!user) {
    console.error("❌ No user found with that characterId. Check the ID.");
    return;
  }

  console.log(
    "👤 Found user:",
    user._id.toString(),
    user.name || user.email || "",
  );

  const scenesCol = db.collection("scenes");

  const newScene = {
    userId: user._id,
    characterId: new ObjectId(CHARACTER_ID),
    sceneTitle: "Second Test Scene (Seeded)",
    sceneDescription: "Seeded directly into the database for testing purposes.",
    mediaType: "video",
    mediaUrl: VIDEO_URL,
    isPublishedAsReel: false,
    reelId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const result = await scenesCol.insertOne(newScene);
  console.log("🎬 Scene inserted! ID:", result.insertedId.toString());
  console.log("   characterId:", CHARACTER_ID);
  console.log("   userId:     ", user._id.toString());
}

main()
  .catch(console.error)
  .finally(() => client.close());
