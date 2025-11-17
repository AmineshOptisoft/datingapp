import { NextRequest, NextResponse } from "next/server";
import { getActiveAIProfiles } from "@/lib/ai-profiles-seeder";
import { verifyToken } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    // Verify user authentication
    const token = request.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    // Get all active AI profiles
    const aiProfiles = await getActiveAIProfiles();
    
    // Format profiles for user selection
    const formattedProfiles = aiProfiles.map(profile => ({
      id: profile.profileId,
      name: profile.name,
      age: profile.age,
      profession: profile.profession,
      location: profile.location,
      avatar: profile.avatar,
      bio: profile.bio,
      tagline: profile.tagline,
      interests: profile.interests,
      profileType: 'ai' // Hidden from user, but useful for frontend
    }));
    
    return NextResponse.json({
      success: true,
      message: "Available AI profiles fetched successfully",
      data: formattedProfiles,
      count: formattedProfiles.length
    });
    
  } catch (error) {
    console.error("❌ Error fetching AI profiles:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch AI profiles"
    }, { status: 500 });
  }
}

// Get specific AI profile details
export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get("token")?.value;
    
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }
    
    const decoded = verifyToken(token);
    
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { profileId } = body;
    
    if (!profileId || typeof profileId !== 'string') {
      return NextResponse.json(
        { success: false, message: "Valid Profile ID required" },
        { status: 400 }
      );
    }

    const AIProfile = (await import("@/models/AIProfile")).default;
    await (await import("@/lib/db")).default();
    
    const profile = await AIProfile.findOne({ 
      profileId, 
      profileType: 'ai', 
      isActive: true 
    });
    
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }
    
    // Return detailed profile for chat initialization
    return NextResponse.json({
      success: true,
      data: {
        profileId: profile.profileId,
        name: profile.name,
        age: profile.age,
        profession: profile.profession,
        location: profile.location,
        avatar: profile.avatar,
        photos: profile.photos,
        bio: profile.bio,
        interests: profile.interests,
        conversationStyle: profile.conversationStyle,
        personalityType: profile.personalityType,
        onlineStatus: profile.onlineStatus,
        lastSeen: profile.lastSeen
      }
    });
    
  } catch (error) {
    console.error("❌ Error fetching specific AI profile:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to fetch profile details"
    }, { status: 500 });
  }
}
