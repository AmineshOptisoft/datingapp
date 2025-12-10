/**
 * Migration Script: Update Voice Settings for Existing AI Profiles
 * 
 * This script updates all existing AI profiles in the database with
 * personality-based voice settings (voiceStability, voiceSimilarity, voiceStyle).
 * 
 * Usage: npm run update-voice-settings
 */

import AIProfile from "../models/AIProfile";
import dbConnect from "../lib/db";
import { getVoiceSettings } from "../lib/voice-settings";

async function updateVoiceSettings() {
  try {
    console.log("🔌 Connecting to database...");
    await dbConnect();
    console.log("✅ Database connected successfully!\n");

    console.log("📊 Fetching all AI profiles...");
    const profiles = await AIProfile.find({ profileType: "ai" });
    console.log(`Found ${profiles.length} AI profiles\n`);

    if (profiles.length === 0) {
      console.log("⚠️ No profiles found. Nothing to update.");
      process.exit(0);
    }

    console.log("🎤 Updating voice settings based on personality types...\n");

    let updatedCount = 0;
    let skippedCount = 0;

    for (const profile of profiles) {
      try {
        if (!profile.personalityType) {
          console.log(`⚠️ Skipping ${profile.name} - No personality type defined`);
          skippedCount++;
          continue;
        }

        const voiceSettings = getVoiceSettings(profile.personalityType);

        await AIProfile.updateOne(
          { _id: profile._id },
          {
            $set: {
              voiceStability: voiceSettings.voiceStability,
              voiceSimilarity: voiceSettings.voiceSimilarity,
              voiceStyle: voiceSettings.voiceStyle,
            },
          }
        );

        console.log(
          `✅ Updated ${profile.name} (${profile.personalityType}) - ` +
          `Stability: ${voiceSettings.voiceStability}, ` +
          `Similarity: ${voiceSettings.voiceSimilarity}, ` +
          `Style: ${voiceSettings.voiceStyle}`
        );

        updatedCount++;
      } catch (error) {
        console.error(`❌ Error updating ${profile.name}:`, error);
      }
    }

    console.log("\n" + "=".repeat(60));
    console.log("📈 Migration Summary:");
    console.log(`   ✅ Successfully updated: ${updatedCount} profiles`);
    console.log(`   ⚠️ Skipped: ${skippedCount} profiles`);
    console.log(`   📊 Total processed: ${profiles.length} profiles`);
    console.log("=".repeat(60) + "\n");

    console.log("🎉 Voice settings migration completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration failed:", error);
    process.exit(1);
  }
}

// Run the migration
updateVoiceSettings();
