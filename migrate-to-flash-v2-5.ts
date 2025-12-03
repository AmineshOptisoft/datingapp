import mongoose from 'mongoose';
import AIProfile from './models/AIProfile';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app';

async function updateVoiceModels() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB');

        // Update all profiles with old voice models to Flash v2.5
        const result = await AIProfile.updateMany(
            {
                voiceModelId: { $in: ['eleven_monolingual_v1', 'eleven_multilingual_v1', 'eleven_multilingual_v2', null] }
            },
            {
                $set: {
                    voiceModelId: 'eleven_flash_v2_5'
                }
            }
        );

        console.log(`\n🎉 Updated ${result.modifiedCount} AI profiles to use Flash v2.5 model`);

        // Show updated profiles
        const updatedProfiles = await AIProfile.find(
            { voiceModelId: 'eleven_flash_v2_5' },
            { name: 1, profileId: 1, voiceModelId: 1 }
        ).limit(10);

        console.log('\n📋 Sample updated profiles:');
        updatedProfiles.forEach(profile => {
            console.log(`   - ${profile.name} (${profile.profileId}): ${profile.voiceModelId}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Migration complete!');
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

updateVoiceModels();
