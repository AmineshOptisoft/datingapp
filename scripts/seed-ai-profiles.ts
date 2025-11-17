import { seedAIProfiles } from "../lib/ai-profiles-seeder";

async function main() {
  try {
    console.log("🚀 Starting AI Profiles seeding script...");
    
    const profiles = await seedAIProfiles();
    
    console.log("\n✅ AI Profiles seeding completed successfully!");
    console.log(`📊 Total profiles created: ${profiles.length}`);
    
    console.log("\n📋 Created Profiles:");
    profiles.forEach((profile, index) => {
      console.log(`   ${index + 1}. ${profile.name} (${profile.age}) - ${profile.profession}`);
      console.log(`      📍 ${profile.location}`);
      console.log(`      💬 ${profile.tagline}`);
      console.log("");
    });
    
    console.log("🎉 You can now use the AI profiles in your dating app!");
    console.log("🔗 Access them via: GET /api/ai-profiles/available");
    
    process.exit(0);
  } catch (error) {
    console.error("❌ Seeding failed:", error);
    process.exit(1);
  }
}

main();
