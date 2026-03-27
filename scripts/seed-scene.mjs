import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app';

// ───────────────────────────────────────────────
// Config
const CHARACTER_ID = '69c28709dc6338c9787e607a';
const VIDEO_URL    = 'https://imagine-public.x.ai/imagine-public/share-videos/1fe50872-e91c-4500-a992-61e6359a5142_hd.mp4';
// ───────────────────────────────────────────────

const client = new MongoClient(MONGODB_URI);

async function main() {
  await client.connect();
  console.log('✅ Connected to MongoDB');

  const db = client.db('dating-app');

  // Find the user who owns this character
  const usersCol = db.collection('users');
  const user = await usersCol.findOne({
    'characters._id': new ObjectId(CHARACTER_ID)
  });

  if (!user) {
    console.error('❌ No user found with that characterId. Check the ID.');
    return;
  }

  console.log('👤 Found user:', user._id.toString(), user.name || user.email || '');

  const scenesCol = db.collection('scenes');

  const newScene = {
    userId:          user._id,
    characterId:     new ObjectId(CHARACTER_ID),
    sceneTitle:      'Test Scene (Seeded)',
    sceneDescription:'Seeded directly into the database for testing purposes.',
    mediaType:       'video',
    mediaUrl:        VIDEO_URL,
    isPublishedAsReel: false,
    reelId:          null,
    createdAt:       new Date(),
    updatedAt:       new Date(),
  };

  const result = await scenesCol.insertOne(newScene);
  console.log('🎬 Scene inserted! ID:', result.insertedId.toString());
  console.log('   characterId:', CHARACTER_ID);
  console.log('   userId:     ', user._id.toString());
}

main()
  .catch(console.error)
  .finally(() => client.close());
