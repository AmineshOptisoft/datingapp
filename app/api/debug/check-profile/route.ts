import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import mongoose from 'mongoose';

export async function GET() {
  try {
    await dbConnect();
    const db = mongoose.connection.db!;

    const TARGET_ID = '69e20ca70b499aceeefddfcd';

    // Characters are stored as subdocuments inside User.characters[]
    const userWithChar = await db.collection('users').findOne(
      { 'characters._id': new mongoose.Types.ObjectId(TARGET_ID) },
      { projection: { name: 1, email: 1, 'characters.$': 1 } }
    );

    if (userWithChar) {
      return NextResponse.json({
        found: true,
        storage: 'Embedded subdocument inside users.characters[]',
        parentUser: {
          _id: userWithChar._id,
          name: userWithChar.name,
          email: userWithChar.email,
        }, 
        character: userWithChar.characters?.[0] ?? null,
      });
    }

    return NextResponse.json({
      found: false,
      targetId: TARGET_ID,
      message: 'No document found with this _id in users.characters[] or any other collection.',
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
