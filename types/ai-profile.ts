export type RoutePrefix = "girl" | "boy" | "companion";
export type AudienceSegment = "for-men" | "for-women" | "for-lgbtq";

export interface AIProfileOverview {
  profileId: string;
  legacyId: number;
  routePrefix: RoutePrefix;
  audienceSegment: AudienceSegment;
  name: string;
  cardTitle: string;
  category: string;
  monthlyPrice: number;
  avatar: string;
  bio: string;
  tagline: string;
  interests: string[];
  badgeHot: boolean;
  badgePro: boolean;
}

export interface AIProfileDetail extends AIProfileOverview {
  age: number;
  profession: string;
  location: string;
  education: string;
  height: string;
  bodyType: string;
  ethnicity: string;
  languages: string[];

  photos: string[];
  eyeColor: string;
  hairColor: string;

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

  lookingFor: string;
  onlineStatus: "online" | "offline" | "recently_active";
  lastSeen: string | Date;
  responseDelay: number;
}


