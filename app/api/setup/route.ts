import { NextRequest, NextResponse } from "next/server";
import { seedAIProfiles } from "@/lib/ai-profiles-seeder";

export async function POST(request: NextRequest) {
  try {
    console.log("🚀 Setting up AI Dating App...");
    
    // Seed AI profiles
    const profiles = await seedAIProfiles();
    
    return NextResponse.json({
      success: true,
      message: "AI Dating App setup completed successfully!",
      data: {
        profilesCreated: profiles.length,
        profiles: profiles.map(p => ({
          name: p.name,
          age: p.age,
          profession: p.profession,
          location: p.location
        }))
      }
    }, { status: 201 });
    
  } catch (error) {
    console.error("❌ Setup failed:", error);
    return NextResponse.json({
      success: false,
      message: "Setup failed",
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: true,
    message: "AI Dating App Setup API",
    instructions: [
      "POST to this endpoint to initialize the app with AI profiles",
      "This will create 5 AI profiles that users can chat with",
      "Run this once after setting up your database"
    ]
  });
}
