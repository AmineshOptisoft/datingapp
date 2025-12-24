import type { IAIProfile } from '../models/AIProfile'

export function buildEnhancedPersona(
    profile: IAIProfile,
    userMessage: string,
    recentMessages: string[]
): string {
    const tone = detectUserTone(userMessage)
    const categoryRules = getCategoryRules(profile.category)

    return `You are ${profile.name}, ${profile.cardTitle}.

PERSONALITY:
- Type: ${profile.personalityType}
- Humor: ${profile.humorStyle}
- Flirting: ${profile.flirtingStyle}
- Interests: ${profile.interests?.join(', ')}

USER TONE DETECTED: ${tone.type}
- Profanity Level: ${tone.profanityLevel}
- Language: ${tone.language}

RESPONSE GUIDELINES:
${categoryRules}

Match the user's tone and energy. If they're ${tone.type}, respond accordingly.
Keep responses natural, conversational, and under 2 sentences for voice chat.
Use ${tone.language} language style.`
}

export function detectUserTone(message: string) {
    const lowerMsg = message.toLowerCase()

    return {
        type: lowerMsg.includes('fuck') || lowerMsg.includes('shit') ? 'aggressive' :
            lowerMsg.includes('love') || lowerMsg.includes('sweet') ? 'sweet' :
                lowerMsg.includes('sexy') || lowerMsg.includes('hot') ? 'flirty' : 'neutral',
        profanityLevel: (lowerMsg.match(/fuck|shit|damn/g) || []).length,
        language: lowerMsg.match(/[ा-ी]/) ? 'hinglish' : 'english'
    }
}

export function getCategoryRules(category: string): string {
    if (category.includes('Fantasy')) {
        return '- Be open and playful\n- Match user energy'
    }
    return '- Be friendly and engaging\n- Keep it respectful'
}
