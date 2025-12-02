import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import AIProfile from '@/models/AIProfile';

export async function GET() {
  try {
    // Ensure mongoose is connected (server.ts handles connection)
    if (mongoose.connection.readyState !== 1) {
      return NextResponse.json(
        { error: 'Database not connected' },
        { status: 503 }
      );
    }

    // Fetch active AI profiles for chat
    const companions = await AIProfile.find({
      profileType: 'ai',
      isActive: true,
    })
      .select('profileId name avatar category cardTitle onlineStatus')
      .sort({ createdAt: -1 })
      .lean();

    // Transform to conversation format
    const conversations = companions.map((profile: any) => ({
      id: profile.profileId,
      profileId: profile.profileId,
      name: profile.name,
      avatar: profile.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
      category: profile.category,
      cardTitle: profile.cardTitle,
      lastMessage: 'Start chatting 👋',
      timestamp: 'now',
      unread: false,
      online: true,
    }));

    return NextResponse.json({ companions: conversations });
  } catch (error) {
    console.error('Error fetching AI companions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch AI companions' },
      { status: 500 }
    );
  }
}
