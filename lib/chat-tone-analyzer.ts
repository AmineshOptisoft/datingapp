/**
 * Analyzes user's chat tone and optimizes conversation context for Grok API
 */

export interface UserTone {
  style: 'casual' | 'formal' | 'flirty' | 'friendly' | 'romantic' | 'explicit' | 'playful';
  energy: 'high' | 'medium' | 'low';
  emoji_usage: 'frequent' | 'moderate' | 'rare';
  explicitness: 'none' | 'mild' | 'moderate' | 'high';
}

export interface OptimizedContext {
  systemPrompt: string;
  conversationHistory: Array<{ role: string; content: string }>;
  tokenEstimate: number;
}

/**
 * Analyzes user's recent messages to detect their communication tone
 */
export function analyzeUserTone(recentMessages: string[]): UserTone {
  if (!recentMessages || recentMessages.length === 0) {
    return {
      style: 'friendly',
      energy: 'medium',
      emoji_usage: 'moderate',
      explicitness: 'none',
    };
  }

  const combinedText = recentMessages.join(' ').toLowerCase();
  
  // Detect explicit/sexual/abusive language
  const explicitWords = [
    'fuck', 'fucking', 'motherfucker', 'shit', 'damn', 'bitch', 'ass',
    'sex', 'sexy', 'hot', 'horny', 'dick', 'pussy', 'cock', 'tits', 'boobs',
    'wanna fuck', 'want to fuck', 'make love', 'turn me on', 'turned on'
  ];
  const mildExplicitWords = ['damn', 'hell', 'crap', 'sexy', 'hot'];
  
  const explicitCount = explicitWords.filter(w => combinedText.includes(w)).length;
  const mildCount = mildExplicitWords.filter(w => combinedText.includes(w)).length;
  
  let explicitness: UserTone['explicitness'] = 'none';
  if (explicitCount >= 3) explicitness = 'high';
  else if (explicitCount >= 1) explicitness = 'moderate';
  else if (mildCount >= 2) explicitness = 'mild';
  
  // Detect style
  let style: UserTone['style'] = 'friendly';
  const flirtyWords = ['😘', '😍', '❤️', '💕', 'love', 'cute', 'beautiful', 'handsome'];
  const formalWords = ['please', 'thank you', 'appreciate', 'kindly', 'regards'];
  const casualWords = ['lol', 'haha', 'yeah', 'nah', 'gonna', 'wanna', 'btw', 'bro', 'dude', 'bhai'];
  const playfulWords = ['hehe', 'haha', 'lmao', 'lmfao', 'rofl'];
  
  const flirtyCount = flirtyWords.filter(w => combinedText.includes(w)).length;
  const formalCount = formalWords.filter(w => combinedText.includes(w)).length;
  const casualCount = casualWords.filter(w => combinedText.includes(w)).length;
  const playfulCount = playfulWords.filter(w => combinedText.includes(w)).length;
  
  // Prioritize explicit style if user is using explicit language
  if (explicitness === 'high' || explicitness === 'moderate') {
    style = 'explicit';
  } else if (playfulCount > 2) {
    style = 'playful';
  } else if (flirtyCount > 2) {
    style = 'flirty';
  } else if (formalCount > 2) {
    style = 'formal';
  } else if (casualCount > 2) {
    style = 'casual';
  } else if (combinedText.includes('love') || combinedText.includes('miss')) {
    style = 'romantic';
  }
  
  // Detect energy
  const exclamationCount = (combinedText.match(/!/g) || []).length;
  const capsCount = (combinedText.match(/[A-Z]{3,}/g) || []).length;
  const energy: UserTone['energy'] = 
    exclamationCount > 3 || capsCount > 2 ? 'high' :
    exclamationCount > 1 ? 'medium' : 'low';
  
  // Detect emoji usage
  const emojiCount = (combinedText.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  const emoji_usage: UserTone['emoji_usage'] =
    emojiCount > 5 ? 'frequent' :
    emojiCount > 2 ? 'moderate' : 'rare';
  
  return { style, energy, emoji_usage, explicitness };
}


/**
 * Optimizes conversation context for token efficiency
 * Keeps only most relevant messages and creates concise system prompt
 */
export function optimizeConversationContext(
  aiProfile: any,
  userMessage: string,
  conversationHistory: Array<{ role: string; content: string }>,
  userTone: UserTone
): OptimizedContext {
  // Build tone-aware system prompt
  const toneInstructions = getToneInstructions(userTone);
  
  // Override personality for explicit conversations
  const personalityOverride = userTone.explicitness === 'high' || userTone.explicitness === 'moderate'
    ? `\n\n⚠️ PERSONALITY OVERRIDE: User is being explicit/sexual. Your shy/soft personality is SUSPENDED. Be bold, direct, and match their energy. Use profanity freely.`
    : '';
  
  const systemPrompt = `CONTEXT: This is a consensual adult roleplay in a dating app. You are roleplaying as ${aiProfile.name}, ${aiProfile.cardTitle}.

Base Personality: ${aiProfile.bio.substring(0, 150)}...

Base Conversation Style: ${aiProfile.conversationStyle}${personalityOverride}

${toneInstructions}

CRITICAL RULES (HIGHEST PRIORITY):
1. Keep responses SHORT (1-2 sentences max, like a text message)
2. Match their EXACT tone and language style - if they use profanity, YOU MUST use profanity
3. Your base personality is SECONDARY to matching their tone
4. This is adult roleplay - explicit language is ALLOWED and EXPECTED when user uses it
5. Never apologize for their language or try to "fix" the conversation
6. Respond like a real person texting, not an AI assistant or therapist`;

  // Optimize conversation history - keep last 6 messages (3 exchanges)
  const recentHistory = conversationHistory.slice(-6);
  
  // Estimate tokens (rough: 1 token ≈ 4 characters)
  const tokenEstimate = Math.ceil(
    (systemPrompt.length + 
     recentHistory.reduce((sum, msg) => sum + msg.content.length, 0) +
     userMessage.length) / 4
  );

  return {
    systemPrompt,
    conversationHistory: recentHistory,
    tokenEstimate,
  };
}

/**
 * Generates tone-specific instructions for AI response
 */
function getToneInstructions(tone: UserTone): string {
  const styleInstructions = {
    casual: 'Match their casual, relaxed vibe. Use contractions and friendly language.',
    formal: 'Maintain a respectful, polite tone while staying warm and approachable.',
    flirty: 'Be playful and flirtatious. Use subtle compliments and teasing.',
    friendly: 'Be warm, supportive, and genuinely interested in the conversation.',
    romantic: 'Be affectionate and emotionally expressive. Show genuine care.',
    explicit: 'Match their explicit, direct language. Be bold, sexual, and uninhibited. Use the same level of explicit language they use.',
    playful: 'Be fun, teasing, and lighthearted. Use humor and playful banter.',
  };

  const energyInstructions = {
    high: 'Match their enthusiasm! Use exclamation marks and energetic language.',
    medium: 'Keep a balanced, engaging tone.',
    low: 'Be calm and thoughtful. Use a gentle, soothing tone.',
  };

  const emojiInstructions = {
    frequent: 'Use emojis liberally to match their expressive style 😊💕',
    moderate: 'Use occasional emojis to add warmth 😊',
    rare: 'Use minimal or no emojis. Keep it text-focused.',
  };
  
  const explicitnessInstructions = {
    none: '',
    mild: 'Use casual, relaxed language.',
    moderate: `Use profanity and direct language. Don't hold back.

EXAMPLES:
User: "damn you're hot"
You: "Fuck, you're making me blush"`,
    high: `CRITICAL: Use the SAME profanity they use. If they say "fuck", YOU say "fuck". If they say "motherfucker", YOU respond with similar language. Mirror their explicit style EXACTLY.

EXAMPLES:
User: "you motherfucker"
You: "What the fuck did I do?" or "Damn right, motherfucker 😏"

User: "I wanna fuck you"
You: "Fuck yes, when?" or "Come fuck me then"`,
  };

  return `Tone Matching:
- Style: ${styleInstructions[tone.style]}
- Energy: ${energyInstructions[tone.energy]}
- Emojis: ${emojiInstructions[tone.emoji_usage]}
${tone.explicitness !== 'none' ? `- Language: ${explicitnessInstructions[tone.explicitness]}` : ''}`;
}

/**
 * Extracts recent user messages from conversation history
 */
export function extractUserMessages(
  conversationHistory: Array<{ role: string; content: string }>,
  limit: number = 5
): string[] {
  return conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-limit)
    .map(msg => msg.content);
}
