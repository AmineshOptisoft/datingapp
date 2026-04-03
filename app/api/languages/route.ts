import { NextResponse } from "next/server";

const LANGUAGES = [
  { id: 'en', name: 'English', flag: '🇺🇸' },
  { id: 'es', name: 'Spanish', flag: '🇪🇸' },
  { id: 'fr', name: 'French', flag: '🇫🇷' },
  { id: 'de', name: 'German', flag: '🇩🇪' },
  { id: 'it', name: 'Italian', flag: '🇮🇹' },
  { id: 'pt', name: 'Portuguese', flag: '🇧🇷' },
  { id: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { id: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { id: 'zh', name: 'Chinese', flag: '🇨🇳' },
  { id: 'ru', name: 'Russian', flag: '🇷🇺' },
  { id: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { id: 'bn', name: 'Bengali', flag: '🇮🇳' },
  { id: 'te', name: 'Telugu', flag: '🇮🇳' },
  { id: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { id: 'ta', name: 'Tamil', flag: '🇮🇳' },
  { id: 'gu', name: 'Gujarati', flag: '🇮🇳' },
  { id: 'kn', name: 'Kannada', flag: '🇮🇳' },
  { id: 'ml', name: 'Malayalam', flag: '🇮🇳' },
  { id: 'pa', name: 'Punjabi', flag: '🇮🇳' },
];

export async function GET() {
  return NextResponse.json({ success: true, languages: LANGUAGES });
}
