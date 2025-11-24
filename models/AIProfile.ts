import mongoose, { Schema, Model } from "mongoose";
import { AudienceSegment, RoutePrefix } from "@/types/ai-profile";

export interface IAIProfile {
  _id: string;
  profileId: string;
  profileType: 'ai';
  isActive: boolean;
  audienceSegment: AudienceSegment;
  routePrefix: RoutePrefix;
  legacyId: number;
  category: string;
  cardTitle: string;
  monthlyPrice: number;
  badgeHot: boolean;
  badgePro: boolean;
  
  // BASIC INFO
  name: string;
  age: number;
  location: string;
  profession: string;
  education: string;
  height: string;
  bodyType: string;
  ethnicity: string;
  languages: string[];
  
  // PHYSICAL ATTRIBUTES
  avatar: string;
  photos: string[];
  eyeColor: string;
  hairColor: string;
  
  // LIFESTYLE
  smokingHabits: string;
  drinkingHabits: string;
  dietaryPreferences: string;
  fitnessLevel: string;
  sleepSchedule: string;
  workSchedule: string;
  travelFrequency: string;
  petOwnership: string;
  livingArrangement: string;
  transportMode: string;
  socialMediaUsage: string;
  partyFrequency: string;
  outdoorActivities: string;
  indoorActivities: string;
  weekendStyle: string;
  
  // PERSONALITY & INTERESTS
  personalityType: string;
  hobbies: string[];
  musicGenres: string[];
  movieGenres: string[];
  bookGenres: string[];
  sportsInterests: string[];
  foodPreferences: string[];
  travelDestinations: string[];
  artInterests: string[];
  techSavviness: string;
  humorStyle: string;
  communicationStyle: string;
  conflictResolution: string;
  socialCircle: string;
  creativityLevel: string;
  
  // DATING PREFERENCES
  relationshipGoals: string;
  datingStyle: string;
  idealDateType: string;
  dealBreakers: string[];
  attractionFactors: string[];
  ageRangePreference: string;
  distancePreference: string;
  religionImportance: string;
  familyPlans: string;
  commitmentLevel: string;
  
  // AI-SPECIFIC CONVERSATION
  conversationStyle: string;
  responsePatterns: string[];
  emotionalIntelligence: string;
  flirtingStyle: string;
  topicPreferences: string[];
  memoryRetention: string;
  personalityQuirks: string[];
  backstoryElements: string[];
  relationshipProgression: string;
  engagementLevel: string;

  // VOICE + AI CONFIG
  personaPrompt?: string;
  realtimeVoiceEnabled?: boolean;
  voiceId?: string;
  voiceModelId?: string;
  voiceAgentId?: string;
  voiceStability?: number;
  voiceSimilarity?: number;
  voiceStyle?: number;
  voiceDescription?: string;
  
  // PROFILE METADATA
  bio: string;
  tagline: string;
  interests: string[];
  lookingFor: string;
  
  // ACTIVITY SIMULATION
  lastSeen: Date;
  onlineStatus: 'online' | 'offline' | 'recently_active';
  responseDelay: number; // in seconds
  
  createdAt: Date;
  updatedAt: Date;
}

export type AIProfileSeed = Omit<IAIProfile, "_id" | "createdAt" | "updatedAt">;

const AIProfileSchema = new Schema<IAIProfile>(
  {
    profileId: {
      type: String,
      required: true,
      unique: true,
    },
    profileType: {
      type: String,
      default: 'ai',
      immutable: true,
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    audienceSegment: {
      type: String,
      enum: ['for-men', 'for-women', 'for-lgbtq'],
      required: true,
    },
    routePrefix: {
      type: String,
      enum: ['girl', 'boy', 'companion'],
      required: true,
    },
    legacyId: {
      type: Number,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    cardTitle: {
      type: String,
      required: true,
    },
    monthlyPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    badgeHot: {
      type: Boolean,
      default: false,
    },
    badgePro: {
      type: Boolean,
      default: false,
    },
    
    // BASIC INFO
    name: {
      type: String,
      required: true,
      trim: true,
    },
    age: {
      type: Number,
      required: true,
      min: 18,
      max: 35,
    },
    location: {
      type: String,
      required: true,
    },
    profession: {
      type: String,
      required: true,
    },
    education: {
      type: String,
      required: true,
    },
    height: {
      type: String,
      required: true,
    },
    bodyType: {
      type: String,
      required: true,
    },
    ethnicity: {
      type: String,
      required: true,
    },
    languages: [{
      type: String,
    }],
    
    // PHYSICAL ATTRIBUTES
    avatar: {
      type: String,
      required: true,
    },
    photos: [{
      type: String,
    }],
    eyeColor: {
      type: String,
      default: 'Brown',
    },
    hairColor: {
      type: String,
      default: 'Black',
    },
    
    // LIFESTYLE
    smokingHabits: String,
    drinkingHabits: String,
    dietaryPreferences: String,
    fitnessLevel: String,
    sleepSchedule: String,
    workSchedule: String,
    travelFrequency: String,
    petOwnership: String,
    livingArrangement: String,
    transportMode: String,
    socialMediaUsage: String,
    partyFrequency: String,
    outdoorActivities: String,
    indoorActivities: String,
    weekendStyle: String,
    
    // PERSONALITY & INTERESTS
    personalityType: String,
    hobbies: [String],
    musicGenres: [String],
    movieGenres: [String],
    bookGenres: [String],
    sportsInterests: [String],
    foodPreferences: [String],
    travelDestinations: [String],
    artInterests: [String],
    techSavviness: String,
    humorStyle: String,
    communicationStyle: String,
    conflictResolution: String,
    socialCircle: String,
    creativityLevel: String,
    
    // DATING PREFERENCES
    relationshipGoals: String,
    datingStyle: String,
    idealDateType: String,
    dealBreakers: [String],
    attractionFactors: [String],
    ageRangePreference: String,
    distancePreference: String,
    religionImportance: String,
    familyPlans: String,
    commitmentLevel: String,
    
    // AI-SPECIFIC
    conversationStyle: String,
    responsePatterns: [String],
    emotionalIntelligence: String,
    flirtingStyle: String,
    topicPreferences: [String],
    memoryRetention: String,
    personalityQuirks: [String],
    backstoryElements: [String],
    relationshipProgression: String,
    engagementLevel: String,

    // VOICE + AI CONFIG
    personaPrompt: {
      type: String,
      default: null,
    },
    realtimeVoiceEnabled: {
      type: Boolean,
      default: false,
    },
    voiceId: {
      type: String,
      default: null,
    },
    voiceModelId: {
      type: String,
      default: "eleven_monolingual_v1",
    },
    voiceAgentId: {
      type: String,
      default: null,
    },
    voiceStability: {
      type: Number,
      default: 0.55,
    },
    voiceSimilarity: {
      type: Number,
      default: 0.75,
    },
    voiceStyle: {
      type: Number,
      default: 0.35,
    },
    voiceDescription: {
      type: String,
      default: null,
    },
    
    // PROFILE METADATA
    bio: {
      type: String,
      maxlength: 500,
    },
    tagline: {
      type: String,
      maxlength: 100,
    },
    interests: [String],
    lookingFor: String,
    
    // ACTIVITY SIMULATION
    lastSeen: {
      type: Date,
      default: Date.now,
    },
    onlineStatus: {
      type: String,
      enum: ['online', 'offline', 'recently_active'],
      default: 'recently_active',
    },
    responseDelay: {
      type: Number,
      default: 3, // 3 seconds default
      min: 1,
      max: 30,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes for better performance
AIProfileSchema.index({ profileId: 1 });
AIProfileSchema.index({ isActive: 1 });
AIProfileSchema.index({ age: 1, location: 1 });
AIProfileSchema.index({ interests: 1 });

const AIProfile: Model<IAIProfile> =
  mongoose.models.AIProfile || mongoose.model<IAIProfile>("AIProfile", AIProfileSchema);

export default AIProfile;
