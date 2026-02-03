# Commit Message

feat: Enhanced Restricted Content Modal with Avatar Display and Expanded Word Filtering

## Description

Implemented comprehensive improvements to the restricted content detection and subscription flow, including visual enhancements to the modal and expanded multilingual word filtering.

## Changes Made

### 1. Restricted Content Modal Styling (`components/RestrictedContentModal.tsx`)

- **Background Image Integration**: Added character avatar as full-screen background with gradient overlay
- **Layout Optimization**: Repositioned content to bottom of modal for better image visibility
- **Button Layout**: Changed to horizontal layout with "Unlock Now" (left) and "Maybe later" (right)
- **Visual Enhancements**:
  - Increased modal height to 600px for better character visibility
  - Applied bottom-heavy gradient overlay (from black to transparent)
  - Added backdrop blur effects for better text readability
  - Included feature indicator with sparkle icon

### 2. Avatar Integration (`app/(main)/messages/MessagesClient.tsx`)

- **State Management**: Updated `restrictedData` state to include avatar field
- **Avatar Retrieval**: Implemented logic to fetch character avatar from conversations list
- **Socket Integration**: Enhanced `restricted_content` event handler to pass avatar to modal
- **Bug Fix**: Moved `conversations` state declaration before usage to fix ReferenceError

### 3. Restricted Words Expansion (`lib/restricted_words.ts`)

- **English Terms**: Comprehensive list of explicit body parts, nudity terms, sexual acts, and adult content
- **Hindi/Devanagari Support**: Added 80+ Hindi terms covering:
  - Body parts (लंड, चूत, गांड, चूचे, स्तन)
  - Explicit acts (चोदना, चुदाई, पेलना, मुठ मारना, संभोग)
  - Derogatory terms (रंडी, कुतिया, हरामी, मादरचोड, बहनचोद)
  - Nudity terms (नंगा, नंगी, कपड़े उतारो, नंगी फोटो)
  - States/conditions (गरम, कामुक, सेक्सी)
- **Total**: 170+ restricted words in both English and Hindi

### 4. Environment Configuration (`.env`)

- Cleaned up corrupted environment variable lines
- Ensured `NEXT_PUBLIC_USER_CHARACTER_PRICE=2` is properly set

## Technical Details

### Files Modified

- `components/RestrictedContentModal.tsx` - Modal UI/UX improvements
- `app/(main)/messages/MessagesClient.tsx` - Avatar integration and state management
- `lib/restricted_words.ts` - Expanded word filtering with multilingual support
- `.env` - Configuration cleanup

### Key Features

1. **Premium Modal Design**: Character image as background with elegant overlay
2. **Multilingual Filtering**: Detects explicit content in both English and Hindi
3. **Improved UX**: Better visual hierarchy and button placement
4. **Robust Detection**: 170+ restricted words covering various explicit categories

## Testing Recommendations

- [ ] Verify modal displays character image correctly
- [ ] Test restricted word detection with English terms
- [ ] Test restricted word detection with Hindi terms
- [ ] Confirm "Unlock Now" button initiates Stripe checkout
- [ ] Verify modal layout on different screen sizes
- [ ] Test with both AI profiles and user-created characters

## Impact

- Enhanced user experience with visually appealing modal design
- Improved content moderation with comprehensive multilingual filtering
- Better monetization flow with clear subscription prompts
- Increased character visibility in restricted content prompts
