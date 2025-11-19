import { NextRequest, NextResponse } from "next/server";
import { getActiveAIProfiles } from "@/lib/ai-profiles-seeder";

export async function GET(request: NextRequest) {
  try {
    // Get all active AI profiles (no authentication required for browsing)
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

// Get specific AI profile details (also public for initial browsing)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { profileId } = body;

    // if (process.env.NODE_ENV === "development") {
    //   try {
    //     await seedAIProfiles();
    //   } catch (seedError) {
    //     console.error("Dev auto-reseed of AI profiles (detail POST) failed:", seedError);
    //   }
    // }
    
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
    
    // Return detailed profile for chat initialization and profile detail view
    return NextResponse.json({
      success: true,
      data: {
        profileId: profile.profileId,
        name: profile.name,
        age: profile.age,
        profession: profile.profession,
        location: profile.location,
        education: profile.education,
        height: profile.height,
        bodyType: profile.bodyType,
        ethnicity: profile.ethnicity,
        languages: profile.languages,

        avatar: profile.avatar,
        photos: profile.photos,
        eyeColor: profile.eyeColor,
        hairColor: profile.hairColor,

        // Lifestyle
        smokingHabits: profile.smokingHabits,
        drinkingHabits: profile.drinkingHabits,
        dietaryPreferences: profile.dietaryPreferences,
        fitnessLevel: profile.fitnessLevel,
        sleepSchedule: profile.sleepSchedule,
        workSchedule: profile.workSchedule,
        travelFrequency: profile.travelFrequency,
        petOwnership: profile.petOwnership,
        livingArrangement: profile.livingArrangement,
        transportMode: profile.transportMode,
        socialMediaUsage: profile.socialMediaUsage,
        partyFrequency: profile.partyFrequency,
        outdoorActivities: profile.outdoorActivities,
        indoorActivities: profile.indoorActivities,
        weekendStyle: profile.weekendStyle,

        // Personality & Interests
        personalityType: profile.personalityType,
        hobbies: profile.hobbies,
        musicGenres: profile.musicGenres,
        movieGenres: profile.movieGenres,
        bookGenres: profile.bookGenres,
        sportsInterests: profile.sportsInterests,
        foodPreferences: profile.foodPreferences,
        travelDestinations: profile.travelDestinations,
        artInterests: profile.artInterests,
        techSavviness: profile.techSavviness,
        humorStyle: profile.humorStyle,
        communicationStyle: profile.communicationStyle,
        conflictResolution: profile.conflictResolution,
        socialCircle: profile.socialCircle,
        creativityLevel: profile.creativityLevel,

        // Dating preferences
        relationshipGoals: profile.relationshipGoals,
        datingStyle: profile.datingStyle,
        idealDateType: profile.idealDateType,
        dealBreakers: profile.dealBreakers,
        attractionFactors: profile.attractionFactors,
        ageRangePreference: profile.ageRangePreference,
        distancePreference: profile.distancePreference,
        religionImportance: profile.religionImportance,
        familyPlans: profile.familyPlans,
        commitmentLevel: profile.commitmentLevel,

        // AI-specific conversation
        conversationStyle: profile.conversationStyle,
        responsePatterns: profile.responsePatterns,
        emotionalIntelligence: profile.emotionalIntelligence,
        flirtingStyle: profile.flirtingStyle,
        topicPreferences: profile.topicPreferences,
        memoryRetention: profile.memoryRetention,
        personalityQuirks: profile.personalityQuirks,
        backstoryElements: profile.backstoryElements,
        relationshipProgression: profile.relationshipProgression,
        engagementLevel: profile.engagementLevel,

        // Metadata
        bio: profile.bio,
        tagline: profile.tagline,
        interests: profile.interests,
        lookingFor: profile.lookingFor,
        onlineStatus: "online",
        lastSeen: profile.lastSeen,
        responseDelay: profile.responseDelay
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
