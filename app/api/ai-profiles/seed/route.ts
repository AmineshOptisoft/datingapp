import { NextRequest, NextResponse } from "next/server";
import { seedAIProfiles } from "@/lib/ai-profiles-seeder";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Starting AI profiles seeding...");
    
    const profiles = await seedAIProfiles();
    
    return NextResponse.json({
      success: true,
      message: `Successfully created ${profiles.length} AI profiles`,
      data: profiles.map(p => ({
        profileId: p.profileId,
        name: p.name,
        age: p.age,
        profession: p.profession,
        location: p.location
      }))
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ AI Profiles seeding failed:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to create AI profiles",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "AI Profiles Seeder API",
    usage: "POST to this endpoint to create/recreate all AI profiles"
  });
}
