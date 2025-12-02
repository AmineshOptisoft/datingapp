import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import Message from '@/models/Message';
import AIProfile from '@/models/AIProfile';

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app';

async function connectDB() {
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(MONGO_URI);
  }
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Find all unique AI profiles user has chatted with using aggregation
    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: userId },
            { receiver: userId }
          ]
        }
      },
      {
        $sort: { createdAt: -1 }
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$sender', userId] },
              '$receiver',
              '$sender'
            ]
          },
          lastMessage: { $first: '$message' },
          lastTimestamp: { $first: '$createdAt' },
          sender: { $first: '$sender' }
        }
      },
      {
        $sort: { lastTimestamp: -1 }
      }
    ]);

    // Fetch AI profile details for each conversation
    const conversationsWithDetails = await Promise.all(
      conversations.map(async (conv) => {
        const profileId = conv._id;
        
        // Fetch AI profile details (only required fields for performance)
        const profile = await AIProfile.findOne({ 
          profileId,
          profileType: 'ai',
          isActive: true 
        })
        .select('profileId name avatar cardTitle category')
        .lean();

        if (!profile) {
          return null; // Skip if profile not found
        }

        // Format timestamp
        const now = new Date();
        const messageDate = new Date(conv.lastTimestamp);
        const diffMs = now.getTime() - messageDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        let timestamp = 'now';
        if (diffMins < 1) timestamp = 'now';
        else if (diffMins < 60) timestamp = `${diffMins}m`;
        else if (diffHours < 24) timestamp = `${diffHours}h`;
        else if (diffDays < 7) timestamp = `${diffDays}d`;
        else timestamp = messageDate.toLocaleDateString();

        return {
          id: profileId,
          profileId: profileId,
          name: profile.name,
          avatar: profile.avatar,
          cardTitle: profile.cardTitle,
          category: profile.category,
          lastMessage: conv.lastMessage,
          timestamp: timestamp,
          unread: false, // Can be enhanced later
          online: true, // AI is always online
        };
      })
    );

    // Filter out null values (profiles that weren't found)
    const validConversations = conversationsWithDetails.filter(c => c !== null);

    return NextResponse.json({ conversations: validConversations });
  } catch (error) {
    console.error('Error fetching conversations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch conversations' },
      { status: 500 }
    );
  }
}
