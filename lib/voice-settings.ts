/**
 * Voice Settings Utility
 * 
 * Maps AI personality types to ElevenLabs voice parameters for unique voice characteristics.
 * 
 * Voice Parameters:
 * - voiceStability (0-1): Lower = more expressive/varied, Higher = more consistent/stable
 * - voiceSimilarity (0-1): How closely the voice matches the original sample
 * - voiceStyle (0-1): Lower = neutral/conversational, Higher = exaggerated/stylized
 */

export interface VoiceSettings {
  voiceStability: number;
  voiceSimilarity: number;
  voiceStyle: number;
}

/**
 * Get voice settings based on personality type
 * @param personalityType - MBTI personality type (e.g., "ESTP - Bold adventurer")
 * @returns Voice settings object with stability, similarity, and style
 */
export function getVoiceSettings(personalityType: string): VoiceSettings {
  // Extract MBTI type from the full personality string
  const mbtiType = personalityType.split(' ')[0].toUpperCase();
  
  // Default fallback values (moderate settings)
  const defaultSettings: VoiceSettings = {
    voiceStability: 0.55,
    voiceSimilarity: 0.75,
    voiceStyle: 0.35,
  };

  // Personality-based voice mapping
  const personalityMap: Record<string, VoiceSettings> = {
    // ESTP - Bold adventurer (Extroverted, Spontaneous, Energetic)
    'ESTP': {
      voiceStability: 0.40,  // More expressive and varied
      voiceSimilarity: 0.70,
      voiceStyle: 0.50,      // More dramatic delivery
    },
    
    // ENTJ - Focused strategist (Confident, Assertive, Direct)
    'ENTJ': {
      voiceStability: 0.65,  // Consistent and controlled
      voiceSimilarity: 0.75,
      voiceStyle: 0.40,      // Moderately stylized
    },
    
    // ISFJ - Gentle nurturer (Warm, Caring, Soft-spoken)
    'ISFJ': {
      voiceStability: 0.75,  // Very consistent and stable
      voiceSimilarity: 0.80,
      voiceStyle: 0.25,      // Soft and natural
    },
    
    // INTP - Curious analyst (Thoughtful, Measured, Intellectual)
    'INTP': {
      voiceStability: 0.60,  // Moderately stable
      voiceSimilarity: 0.75,
      voiceStyle: 0.30,      // Neutral and conversational
    },
    
    // ENFP - Warm visionary (Enthusiastic, Expressive, Bubbly)
    'ENFP': {
      voiceStability: 0.35,  // Very expressive and varied
      voiceSimilarity: 0.70,
      voiceStyle: 0.55,      // Highly stylized and animated
    },
    
    // ENFJ - Passionate charmer (Charismatic, Engaging, Flirty)
    'ENFJ': {
      voiceStability: 0.38,  // Expressive with emotional range
      voiceSimilarity: 0.72,
      voiceStyle: 0.52,      // Stylized and charming
    },
    
    // INFJ - Empathetic dreamer (Deep, Thoughtful, Introspective)
    'INFJ': {
      voiceStability: 0.70,  // Stable with emotional depth
      voiceSimilarity: 0.78,
      voiceStyle: 0.28,      // Gentle and sincere
    },
    
    // ESFP - Playful entertainer (Fun, Spontaneous, Lively)
    'ESFP': {
      voiceStability: 0.42,  // Expressive and playful
      voiceSimilarity: 0.68,
      voiceStyle: 0.48,      // Animated delivery
    },
    
    // ISTJ - Reliable organizer (Steady, Dependable, Calm)
    'ISTJ': {
      voiceStability: 0.72,  // Very stable and consistent
      voiceSimilarity: 0.78,
      voiceStyle: 0.22,      // Neutral and professional
    },
    
    // ENTP - Creative debater (Quick-witted, Dynamic, Clever)
    'ENTP': {
      voiceStability: 0.45,  // Varied with energy
      voiceSimilarity: 0.72,
      voiceStyle: 0.45,      // Moderately stylized
    },
    
    // ISTP - Cool pragmatist (Calm, Reserved, Practical)
    'ISTP': {
      voiceStability: 0.68,  // Stable and controlled
      voiceSimilarity: 0.76,
      voiceStyle: 0.26,      // Understated delivery
    },
    
    // ESFJ - Social connector (Warm, Friendly, Engaging)
    'ESFJ': {
      voiceStability: 0.48,  // Moderately expressive
      voiceSimilarity: 0.74,
      voiceStyle: 0.42,      // Friendly and approachable
    },
    
    // INTJ - Strategic thinker (Composed, Analytical, Measured)
    'INTJ': {
      voiceStability: 0.66,  // Controlled and deliberate
      voiceSimilarity: 0.76,
      voiceStyle: 0.32,      // Subtle and intellectual
    },
    
    // INFP - Idealistic dreamer (Soft, Gentle, Reflective)
    'INFP': {
      voiceStability: 0.72,  // Stable with gentle variation
      voiceSimilarity: 0.80,
      voiceStyle: 0.24,      // Very natural and soft
    },
    
    // ESTJ - Efficient leader (Direct, Confident, Structured)
    'ESTJ': {
      voiceStability: 0.62,  // Consistent and clear
      voiceSimilarity: 0.74,
      voiceStyle: 0.38,      // Professional delivery
    },
    
    // ENFP variant - Creative enthusiast
    'ENFP-A': {
      voiceStability: 0.36,
      voiceSimilarity: 0.70,
      voiceStyle: 0.54,
    },
  };

  // Return mapped settings or default
  return personalityMap[mbtiType] || defaultSettings;
}

/**
 * Apply voice settings to an AI profile object
 * @param profile - AI profile object with personalityType
 * @returns Profile with voice settings applied
 */
export function applyVoiceSettings<T extends { personalityType: string }>(
  profile: T
): T & VoiceSettings {
  const voiceSettings = getVoiceSettings(profile.personalityType);
  
  return {
    ...profile,
    ...voiceSettings,
  };
}
