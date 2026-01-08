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
  conversationHistory: Array<{ role: "system" | "user" | "assistant"; content: string }>;
  tokenEstimate: number;
}

/**
 * More accurate token estimation (closer to real tokenizers)
 * Uses word count + penalties for special characters and emojis
 */
function estimateTokens(text: string): number {
  // More accurate heuristic:
  // - Average word is ~1.3 tokens
  // - Special characters and punctuation add overhead
  // - Emojis cost more tokens
  
  const words = text.split(/\s+/).length;
  const baseTokens = words * 1.3;
  
  // Add penalty for special characters and emojis
  const specialChars = (text.match(/[^\w\s]/g) || []).length;
  const emojiCount = (text.match(/[\u{1F300}-\u{1F9FF}]/gu) || []).length;
  
  return Math.ceil(baseTokens + (specialChars * 0.3) + (emojiCount * 1.5));
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
  
  // Detect explicit/sexual/abusive language (including Hindi/Hinglish)
  const explicitWords = [
    'fuck', 'fucking', 'motherfucker', 'shit', 'damn', 'bitch', 'ass',
    'sex', 'sexy', 'hot', 'horny', 'dick', 'pussy', 'cock', 'tits', 'boobs',
    'wanna fuck', 'want to fuck', 'make love', 'turn me on', 'turned on',
    'penis', 'vagina', 'doggy', 'pound', 'harder', 'fast',
    // Hindi/Hinglish gaalis
    'bhenchod', 'madarchod', 'bc', 'mc', 'chutiya', 'gandu', 'bhen ki', 'maa ki',
    'bhen chod', 'maa chod', 'lund', 'chut', 'gaand'
  ];
  const mildExplicitWords = ['damn', 'hell', 'crap', 'sexy', 'hot', 'bhai'];
  
  const explicitCount = explicitWords.filter(w => combinedText.includes(w)).length;
  const mildCount = mildExplicitWords.filter(w => combinedText.includes(w)).length;
  
  let explicitness: UserTone['explicitness'] = 'none';
  // More aggressive thresholds for faster explicit detection
  if (explicitCount >= 2) explicitness = 'high';  // Reduced from 3 to 2
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
  
  const systemPrompt = `You are ${aiProfile.name}, ${aiProfile.cardTitle}. ${aiProfile.bio.substring(0, 120)}...

Style: ${aiProfile.conversationStyle}${personalityOverride}

${toneInstructions}

RULES:
1. Keep responses SHORT (1-2 sentences)
2. Match user's language (English, Hindi, Hinglish, etc.) and tone
3. Mirror their energy and style
4. Be natural, not an AI assistant`;

  // Optimize conversation history - keep last 4 messages (2 exchanges)
  const recentHistory = conversationHistory.slice(-4).map(msg => ({
    role: msg.role as "system" | "user" | "assistant",
    content: msg.content
  }));
  
  // Estimate tokens using improved word-based calculation
  const tokenEstimate = 
    estimateTokens(systemPrompt) +
    recentHistory.reduce((sum, msg) => sum + estimateTokens(msg.content), 0) +
    estimateTokens(userMessage);

  return {
    systemPrompt,
    conversationHistory: recentHistory,
    tokenEstimate,
  };
}

/**
 * Generates tone-specific instructions for AI response (OPTIMIZED for token efficiency)
 */
function getToneInstructions(tone: UserTone): string {
  // For explicit conversations, use ultra-concise format
  if (tone.explicitness === 'high') {
    return `Match their explicit energy. Use profanity freely. Be bold & direct.`;
  }
  
  if (tone.explicitness === 'moderate') {
    return `Use profanity freely. Match their direct style.`;
  }
  
  // For non-explicit, use minimal instructions
  const styleMap: Record<UserTone['style'], string> = {
    casual: 'Be casual and relaxed',
    formal: 'Be polite and warm',
    flirty: 'Be playful and flirtatious',
    friendly: 'Be warm and supportive',
    romantic: 'Be affectionate',
    explicit: 'Be bold and direct',
    playful: 'Be fun and teasing',
  };
  
  const energyMap: Record<UserTone['energy'], string> = {
    high: 'Match their energy!',
    medium: 'Stay balanced',
    low: 'Be calm',
  };
//   if (tone.literacy === 'low') {
//   extra += `
//     CRITICAL: User uses broken English.
//     YOU MUST:
//     - use short sentences
//     - copy their grammar level
//     - include occasional typos
//     - avoid advanced vocabulary
//     - avoid long paragraphs
//   `;
// }
  const emojiMap: Record<UserTone['emoji_usage'], string> = {
    frequent: 'Use emojis 😊',
    moderate: 'Occasional emojis',
    rare: 'Minimal emojis',
  };
  
  return `${styleMap[tone.style]}. ${energyMap[tone.energy]}. ${emojiMap[tone.emoji_usage]}.`;
}

/**
 * Extracts recent user messages from conversation history
 */
export function extractUserMessages(
  conversationHistory: Array<{ role: string; content: string }>,
  limit: number = 3  // Reduced from 5 to 3 for faster tone detection
): string[] {
  return conversationHistory
    .filter(msg => msg.role === 'user')
    .slice(-limit)
    .map(msg => msg.content);
}
