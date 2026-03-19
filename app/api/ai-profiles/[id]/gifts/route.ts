import { NextResponse } from 'next/server';
import mongoose from 'mongoose';
import dbConnect from '@/lib/db';
import GiftTransaction from '@/models/GiftTransaction';
import User from '@/models/User';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    
    if (!mongoose.models.User) {
      console.log("Loading User Model");
    }

    const profileId = params.id;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '30', 10);
    const skip = (page - 1) * limit;

    if (!profileId) {
      return NextResponse.json({ success: false, error: 'Profile ID is required' }, { status: 400 });
    }

    const filter = {
      receiver: profileId
    };

    const totalGifts = await GiftTransaction.countDocuments(filter);

    const giftTransactions = await GiftTransaction.find(filter)
      .populate({ path: 'sender', select: 'name avatar', model: User })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const gifts = giftTransactions.map((msg: any) => {
      return {
        _id: msg._id,
        giftName: msg.giftName,
        sender: {
          _id: msg.sender?._id || 'unknown',
          name: msg.sender?.name || 'Unknown User',
          avatar: msg.sender?.avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop',
        },
        price: msg.price,
        createdAt: msg.createdAt
      };
    }).filter(Boolean);

    return NextResponse.json({
      success: true,
      gifts,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalGifts / limit),
        totalGifts,
        hasMore: page * limit < totalGifts
      }
    });
  } catch (error) {
    console.error('Error fetching AI profile gifts:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch gifts' }, { status: 500 });
  }
}
