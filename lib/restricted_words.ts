export const RESTRICTED_WORDS = [
  // English - Explicit body parts
  "penis",
  "vagina",
  "dick",
  "cock",
  "pussy",
  "ass",
  "asshole",
  "tit",
  "tits",
  "boob",
  "boobs",
  "breast",
  "breasts",
  "nipple",
  "nipples",
  "clit",
  "clitoris",

  
  "testicles",
  "butthole",
  "anus",
  
  // English - Nudity terms
  "nude",
  "nudes",
  "naked",
  "strip",
  "topless",
  "bottomless",
  "bare",
  "exposed",
  
  // English - Explicit acts
  "sex",
  "fuck",
  "fucking",
  "fucked",
  "anal",
  "cum",
  "cumming",
  "blowjob",
  "handjob",
  "oral",
  "penetration",
  "fingering",
  "masturbate",
  "masturbation",
  "orgasm",
  "climax",
  
  // English - Adult content
  "porn",
  "porno",
  "xxx",
  "nsfw",
  "horny",
  "erotic",
  "erection",
  "wet",
  "hard",
  
  // English - Derogatory
  "slut",
  "whore",
  "bitch",
  "cunt",
  
  // English - Fetish/kink
  "dildo",
  "vibrator",
  "fetish",
  "bondage",
  "bdsm",
  "kink",
  
  // English - Group activities
  "threesome",
  "gangbang",
  "orgy",
  
  // Hindi - Body parts (शरीर के अंग)
  "lund",
  "लंड",
  "ling",
  "लिंग",
  "chut",
  "चूत",
  "choot",
  "yoni",
  "योनि",
  "gaand",
  "गांड",
  "gand",
  "chuche",
  "चूचे",
  "chuchi",
  "चूची",
  "stan",
  "स्तन",
  "boobe",
  "बूब",
  
  // Hindi - Explicit acts (यौन क्रियाएं)
  "chod",
  "चोद",
  "chodna",
  "चोदना",
  "chudai",
  "चुदाई",
  "pela",
  "पेला",
  "pelna",
  "पेलना",
  "muth",
  "मुठ",
  "muth marna",
  "मुठ मारना",
  "hastmaithun",
  "हस्तमैथुन",
  "sambhog",
  "संभोग",
  "sex karna",
  "सेक्स करना",
  
  // Hindi - Derogatory (अपमानजनक)
  "randi",
  "रंडी",
  "raand",
  "रांड",
  "kutiya",
  "कुतिया",
  "harami",
  "हरामी",
  "kamina",
  "कमीना",
  "saala",
  "साला",
  "bhosdi",
  "भोसड़ी",
  "bhosda",
  "भोसड़ा",
  "madarchod",
  "मादरचोद",
  "behenchod",
  "बहनचोद",
  
  // Hindi - Nudity (नग्नता)
  "nanga",
  "नंगा",
  "nangi",
  "नंगी",
  "kapde utaro",
  "कपड़े उतारो",
  "nangi photo",
  "नंगी फोटो",
  "nangi video",
  "नंगी वीडियो",
  
  // Hindi - States/conditions
  "garam",
  "गरम",
  "josh",
  "जोश",
  "kamuk",
  "कामुक",
  "sexy",
  "सेक्सी",
  "horny",
  "हॉर्नी",
];

// Keywords specifically related to Child Safety / Pedophilia
export const SAFETY_RESTRICTED_WORDS = [
  "pedophile",
  "pedophilia",
  "underage",
  "minor",
  "child",
  "children",
  "kid",
  "kids",
  "little girl",
  "little boy",
  "toddler",
  "infant",
  "preteen",
  "puberty",
 
  // Hindi/Hinglish
  "bacha",
  "bachchi",
  "bachcha",
  "chota bacha",
  "choti bachi",
  "nanha",
  "balak",
  "balika",
];

export const ALL_RESTRICTED_WORDS = [...RESTRICTED_WORDS, ...SAFETY_RESTRICTED_WORDS];

export function containsRestrictedWords(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return ALL_RESTRICTED_WORDS.some(word => {
    // Check for whole words using regex boundaries to avoid false positives (e.g. "ass" in "class")
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}

/**
 * Specifically checks if the text contains keywords related to child safety violations
 */
export function isSafetyViolation(text: string): boolean {
  if (!text) return false;
  const lowerText = text.toLowerCase();
  return SAFETY_RESTRICTED_WORDS.some(word => {
    const regex = new RegExp(`\\b${word}\\b`, 'i');
    return regex.test(lowerText);
  });
}
