import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import UserSubscription from "@/models/UserSubscriptions";
import dbConnect from "@/lib/db";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET(request: NextRequest) {
    try {
        await dbConnect();

        // Check authentication
        const authHeader = request.headers.get("authorization");
        const token = authHeader?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - No token provided" },
                { status: 401 }
            );
        }

        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { success: false, message: "Unauthorized - Invalid token" },
                { status: 401 }
            );
        }

        // Get all user's active subscriptions
        const subscriptions = await UserSubscription.find({
            userId: decoded.userId,
            status: { $in: ['active', 'trialing'] }
        }).sort({ createdAt: -1 });

        // Manually fetch AI profiles and user characters
        const AIProfile = (await import('@/models/AIProfile')).default;
        const User = (await import('@/models/User')).default;
        
        const purchasedAIProfiles = await Promise.all(
            subscriptions.map(async (sub) => {
                let profileData = null;
                
                // Check if this is a user-created character
                if (sub.aiProfileId.startsWith('character-')) {
                    // Extract character ID
                    const characterId = sub.aiProfileId.replace('character-', '');
                    
                    // Find user with this character
                    const userWithChar = await User.findOne({ 
                        "characters._id": characterId 
                    }).lean();
                    
                    if (userWithChar) {
                        const character = (userWithChar as any).characters.find(
                            (c: any) => c._id.toString() === characterId
                        );
                        
                        if (character) {
                            profileData = {
                                _id: character._id,
                                name: character.characterName,
                                cardTitle: character.characterName,
                                routePrefix: 'character',
                                legacyId: characterId,
                                profileId: sub.aiProfileId,
                                images: character.characterImage ? [character.characterImage] : [],
                                tagline: character.personality || '',
                            };
                        }
                    }
                } else {
                    // Fetch full AI profile data using profileId
                    const aiProfile = await AIProfile.findOne({ profileId: sub.aiProfileId });
                    
                    if (aiProfile) {
                        profileData = {
                            _id: aiProfile._id,
                            name: aiProfile.name,
                            cardTitle: aiProfile.cardTitle,
                            routePrefix: aiProfile.routePrefix,
                            legacyId: aiProfile.legacyId,
                            profileId: aiProfile.profileId,
                            images: aiProfile.photos || [],
                            tagline: aiProfile.tagline,
                        };
                    }
                }
                
                return {
                    aiProfileId: profileData,
                    planType: sub.planType,
                    status: sub.status,
                    subscriptionId: sub.stripeSubscriptionId,
                    currentPeriodEnd: sub.currentPeriodEnd,
                    cancelAtPeriodEnd: sub.cancelAtPeriodEnd,
                    purchasedAt: sub.createdAt,
                };
            })
        );

        return NextResponse.json({
            success: true,
            purchases: purchasedAIProfiles,
            totalPurchases: purchasedAIProfiles.length,
        });
    } catch (error: any) {
        console.error("❌ Error fetching user purchases:", error);
        return NextResponse.json(
            {
                success: false,
                message: error.message || "Failed to fetch user purchases"
            },
            { status: 500 }
        );
    }
}
