import AIProfile, { AIProfileSeed } from "@/models/AIProfile";
import dbConnect from "@/lib/db";
import { girlProfiles } from "@/lib/data/girls";
import { boyProfiles } from "@/lib/data/boys";
import { lgbtqProfiles } from "@/lib/data/lgbtq";
import type { AudienceSegment } from "@/types/ai-profile";
import { applyVoiceSettings } from "@/lib/voice-settings";

export const aiProfilesData: AIProfileSeed[] = [
  ...girlProfiles,
  ...boyProfiles,
  ...lgbtqProfiles,
];

interface GetProfilesFilters {
  segment?: AudienceSegment | string | null;
  category?: string | null;
  selectFields?: string | null;
}

export async function seedAIProfiles() {
  try {
    await dbConnect();
    
    console.log("🌱 Starting AI Profiles seeding...");
    
    await AIProfile.deleteMany({ profileType: "ai" });
    console.log("🗑️ Cleared existing AI profiles");
    
    // Apply voice settings to each profile based on personality type
    const profilesWithVoiceSettings = aiProfilesData.map(profile => 
      applyVoiceSettings(profile)
    );
    
    console.log("🎤 Applied personality-based voice settings to all profiles");
    
    const createdProfiles = await AIProfile.insertMany(profilesWithVoiceSettings);
    console.log(`✅ Created ${createdProfiles.length} AI profiles successfully!`);
    
    createdProfiles.forEach((profile) => {
      console.log(`   - ${profile.name} (${profile.profileId}) - Stability: ${profile.voiceStability}, Style: ${profile.voiceStyle}`);
    });
    
    return createdProfiles;
  } catch (error) {
    console.error("❌ Error seeding AI profiles:", error);
    throw error;
  }
}

export async function getActiveAIProfiles(filters: GetProfilesFilters = {}) {
  try {
    await dbConnect();

    const query: Record<string, unknown> = {
      profileType: "ai",
      isActive: true,
    };

    if (filters.segment) {
      query.audienceSegment = filters.segment;
    }

    if (filters.category && filters.category !== "All") {
      query.category = filters.category;
    }

    const selectFields =
      filters.selectFields ??
      "profileId legacyId routePrefix audienceSegment name cardTitle category monthlyPrice avatar bio tagline interests badgeHot badgePro";

    return AIProfile.find(query)
      .select(selectFields)
      .sort({ legacyId: 1 })
      .lean();
  } catch (error) {
    console.error("❌ Error while fetching AI profiles:", error);
    return [];
  }
}
