import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { seedAIProfiles, getActiveAIProfiles } from "@/lib/ai-profiles-seeder";

export async function POST(request: NextRequest) {
  try {
    console.log("� Initializing full AI profiles (detailed)...");

    await dbConnect();
    console.log("✅ Database connected");

    // Use the main seeder which already clears old AI profiles and inserts aiProfilesData
    const createdProfiles = await seedAIProfiles();
    const activeProfiles = await getActiveAIProfiles();

    return NextResponse.json({
      success: true,
      message: `Successfully created ${createdProfiles.length} detailed AI profiles`,
      data: {
        profilesCreated: createdProfiles.length,
        profiles: activeProfiles.map((p) => ({
          profileId: p.profileId,
          name: p.name,
          age: p.age,
          profession: p.profession,
          location: p.location,
        })),
      },
    }, { status: 201 });
  } catch (error) {
    console.error("❌ Profile initialization failed:", error);
    return NextResponse.json({
      success: false,
      message: "Failed to initialize profiles",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const activeProfiles = await getActiveAIProfiles();

    return NextResponse.json({
      success: true,
      message: `Found ${activeProfiles.length} AI profiles in database`,
      data: { count: activeProfiles.length },
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: "Failed to check profiles",
      error: error instanceof Error ? error.message : "Unknown error",
    }, { status: 500 });
  }
}
