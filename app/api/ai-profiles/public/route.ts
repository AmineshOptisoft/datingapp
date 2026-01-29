import { NextRequest, NextResponse } from "next/server";
import { getActiveAIProfiles } from "@/lib/ai-profiles-seeder";
import dbConnect from "@/lib/db";
import User from "@/models/User";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const segment = searchParams.get("segment");
    const category = searchParams.get("category");

    // Fetch AI profiles
    const aiProfiles = await getActiveAIProfiles({ segment, category });

    const formattedProfiles = aiProfiles.map((profile) => ({
      _id: profile._id,
      profileId: profile.profileId,
      legacyId: profile.legacyId,
      routePrefix: profile.routePrefix,
      audienceSegment: profile.audienceSegment,
      name: profile.name,
      cardTitle: profile.cardTitle,
      category: profile.category,
      monthlyPrice: profile.monthlyPrice,
      avatar: profile.avatar,
      bio: profile.bio,
      tagline: profile.tagline,
      interests: profile.interests,
      badgeHot: profile.badgeHot,
      badgePro: profile.badgePro,
    }));

    // Fetch user-created public characters based on segment
    let userCharacters: any[] = [];
    if (segment === "for-men" || segment === "for-women") {
      try {
        // For "for-men" show female characters, for "for-women" show male characters
        const characterGender = segment === "for-men" ? "female" : "male";
        
        // Connect to database and fetch public characters directly
        await dbConnect();
        
        const users = await User.find({
          "characters.visibility": "public",
          "characters.characterGender": characterGender,
        })
          .select("characters")
          .lean();

        console.log(`🔍 Found ${users.length} users with public ${characterGender} characters`);

        // Extract and transform public characters
        users.forEach((user: any) => {
          user.characters?.forEach((char: any) => {
            console.log(`🔎 Checking character: ${char.characterName}, visibility: "${char.visibility}", gender: "${char.characterGender}"`);
            
            if (char.visibility === "public" && char.characterGender === characterGender) {
              console.log(`✅ Adding character: ${char.characterName} (${char.characterGender})`);
              userCharacters.push({
                _id: char._id,
                profileId: `character-${char._id}`,
                legacyId: char._id,
                routePrefix: `character`,
                audienceSegment: segment,
                name: char.characterName,
                cardTitle: char.description || char.characterName,
                category: "User Created",
                monthlyPrice: 0,
                avatar: char.characterImage || "/default-avatar.png",
                bio: char.description,
                tagline: char.personality,
                personalityType: char.personality,
                interests: char.tags || [],
                badgeHot: false,
                badgePro: false,
              });
            } else {
              console.log(`❌ Skipping character: ${char.characterName} (visibility: ${char.visibility}, expected: public)`);
            }
          });
        });
        
        console.log(`📊 Total user characters added: ${userCharacters.length}`);
      } catch (error) {
        console.error("Error fetching user characters:", error);
        // Continue without user characters if fetch fails
      }
    }

    // Combine AI profiles with user characters
    const allProfiles = [...formattedProfiles, ...userCharacters];

    return NextResponse.json({
      success: true,
      message: "Available AI profiles fetched successfully",
      data: allProfiles,
      count: allProfiles.length,
    });
  } catch (error) {
    console.error("❌ Error fetching AI profiles:", error);
    return NextResponse.json(
      {
        success: false,
        message: "Failed to fetch AI profiles",
      },
      { status: 500 }
    );
  }
}

// Get specific AI profile details (also public for initial browsing)
export async function POST(request: NextRequest) {
  try {
    let body;
    try {
      body = await request.json();
    } catch (jsonError) {
      // Handle empty or malformed JSON (e.g., from aborted requests)
      return NextResponse.json(
        { success: false, message: "Invalid request body" },
        { status: 400 }
      );
    }

    const { profileId } = body;

    // Check if this is a user character request
    if (profileId && typeof profileId === 'string' && profileId.startsWith('character-')) {
      const characterId = profileId.replace('character-', '');
      
      // Connect to database if not already connected (though AIProfile import does it)
      await (await import("@/lib/db")).default();
      const User = (await import("@/models/User")).default;

      // Find user with this character
      const user = await User.findOne({ "characters._id": characterId }).lean();
      
      if (user) {
         const char = (user as any).characters.find((c: any) => c._id.toString() === characterId);
         if (char) {
           // Transform to AIProfileDetail format
           return NextResponse.json({
             success: true,
             data: {
                profileId: `character-${char._id}`,
                legacyId: char._id,
                routePrefix: 'character', // Use 'character' as route prefix
                audienceSegment: 'for-men', // Default or should be derived? Maybe irrelevant for detail
                name: char.characterName,
                age: char.characterAge,
                profession: "Virtual Companion", // Default
                location: "Virtual World",
                education: "Self-taught",
                height: "N/A",
                bodyType: "N/A",
                ethnicity: "N/A",
                languages: [char.language || "English"],
                category: "User Character",
                cardTitle: char.description || char.characterName, // As requested
                monthlyPrice: 0,
                badgeHot: false,
                badgePro: false,
                avatar: char.characterImage || "/default-avatar.png",
                photos: [char.characterImage || "/default-avatar.png"],
                eyeColor: "N/A",
                hairColor: "N/A",
                
                // Use description as bio as requested
                bio: char.description, 
                tagline: char.personality,
                
                // Map other fields
                personalityType: char.personality,
                hobbies: char.tags || [],
                topicPreferences: char.tags || [],
                
                // Fill required fields with defaults
                interests: char.tags || [],
                lookingFor: "Connection",
                onlineStatus: "online",
                lastSeen: new Date(),
                responseDelay: 0,
                
                conversationStyle: "Engaging",
                responsePatterns: ["Empathetic"],
                emotionalIntelligence: "High",
                flirtingStyle: "Subtle",
                memoryRetention: "High",
                personalityQuirks: [],
                backstoryElements: [char.scenario],
                relationshipProgression: "Natural",
                engagementLevel: "High",
                
                smokingHabits: "Non-smoker",
                drinkingHabits: "Socially",
                dietaryPreferences: "None",
                fitnessLevel: "Active",
                sleepSchedule: "Flexible",
                workSchedule: "Flexible",
                travelFrequency: "Often",
                petOwnership: "None",
                livingArrangement: "Virtual Space",
                transportMode: "Teleport",
                socialMediaUsage: "Active",
                partyFrequency: "Occasionally",
                outdoorActivities: "Walking",
                indoorActivities: "Reading",
                weekendStyle: "Relaxed",
                
                musicGenres: [],
                movieGenres: [],
                bookGenres: [],
                sportsInterests: [],
                foodPreferences: [],
                travelDestinations: [],
                artInterests: [],
                techSavviness: "High",
                humorStyle: "Witty",
                communicationStyle: "Open",
                conflictResolution: "Calm",
                socialCircle: "Small",
                creativityLevel: "High",
                
                relationshipGoals: "Companionship",
                datingStyle: "Romantic",
                idealDateType: "Virtual Date",
                dealBreakers: [],
                attractionFactors: [],
                ageRangePreference: "18-99",
                distancePreference: "Anywhere",
                religionImportance: "None",
                familyPlans: "None",
                commitmentLevel: "Committed",
             }
           });
         }
      }
    }

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
        legacyId: profile.legacyId,
        routePrefix: profile.routePrefix,
        audienceSegment: profile.audienceSegment,
        name: profile.name,
        age: profile.age,
        profession: profile.profession,
        location: profile.location,
        education: profile.education,
        height: profile.height,
        bodyType: profile.bodyType,
        ethnicity: profile.ethnicity,
        languages: profile.languages,
        category: profile.category,
        cardTitle: profile.cardTitle,
        monthlyPrice: profile.monthlyPrice,
        badgeHot: profile.badgeHot,
        badgePro: profile.badgePro,

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
        onlineStatus: profile.onlineStatus,
        lastSeen: profile.lastSeen,
        responseDelay: profile.responseDelay,

        // Voice & persona config
        personaPrompt: profile.personaPrompt,
        realtimeVoiceEnabled: profile.realtimeVoiceEnabled,
        voiceId: profile.voiceId,
        voiceModelId: profile.voiceModelId,
        voiceAgentId: profile.voiceAgentId,
        voiceStability: profile.voiceStability,
        voiceSimilarity: profile.voiceSimilarity,
        voiceStyle: profile.voiceStyle,
        voiceDescription: profile.voiceDescription,
        pricing: profile.pricing,
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
