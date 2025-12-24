import dotenv from 'dotenv';
import mongoose from 'mongoose';
import AIProfile from './models/AIProfile';

dotenv.config({ path: '.env.local' });

const MONGO_URI =
    process.env.MONGODB_URI ||
    'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app';

async function updateVoiceModels() {
    try {
        // Connect to MongoDB
        await mongoose.connect(MONGO_URI);
        console.log('✅ MongoDB connected');

        // Update all AI profiles with old voice model to new one
        const result = await AIProfile.updateMany(
            {
                voiceModelId: { $in: ['eleven_multilingual_v1', 'eleven_monolingual_v1', null] }
            },
            {
                $set: {
                    voiceModelId: 'eleven_multilingual_v2'
                }
            }
        );

        console.log(`✅ Updated ${result.modifiedCount} AI profiles`);
        console.log(`   - Changed voiceModelId to: eleven_multilingual_v2`);

        // Show updated profiles
        const updatedProfiles = await AIProfile.find(
            { profileType: 'ai' },
            { name: 1, profileId: 1, voiceModelId: 1 }
        );

        console.log('\n📋 All AI Profiles:');
        updatedProfiles.forEach((profile) => {
            console.log(`   - ${profile.name} (${profile.profileId}): ${profile.voiceModelId}`);
        });

        await mongoose.disconnect();
        console.log('\n✅ Done! All profiles updated.');
    } catch (error) {
        console.error('❌ Error updating voice models:', error);
        process.exit(1);
    }
}

updateVoiceModels();
