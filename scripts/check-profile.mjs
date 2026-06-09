import { MongoClient, ObjectId } from 'mongodb';

const uri = 'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app';
const TARGET_ID = '69e20ca70b499aceeefddfcd';

async function main() {
  const client = new MongoClient(uri);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');
    const db = client.db('dating-app');

    // List all collections
    const collections = await db.listCollections().toArray();
    console.log('\n📦 Collections:', collections.map(c => c.name).join(', '));

    // Search in 'characters' collection
    const charDoc = await db.collection('characters').findOne({ _id: new ObjectId(TARGET_ID) });
    if (charDoc) {
      console.log('\n✅ FOUND in [characters] collection:');
      console.log(JSON.stringify(charDoc, null, 2));
    } else {
      console.log('\n❌ NOT found in [characters] collection');
    }

    // Also search in any other likely collections
    for (const col of collections.map(c => c.name)) {
      if (col === 'characters') continue;
      try {
        const doc = await db.collection(col).findOne({ _id: new ObjectId(TARGET_ID) });
        if (doc) {
          console.log(`\n✅ FOUND in [${col}] collection:`, JSON.stringify(doc, null, 2));
        }
      } catch {}
    }
  } finally {
    await client.close();
    console.log('\nDone.');
  }
}

main().catch(console.error);
