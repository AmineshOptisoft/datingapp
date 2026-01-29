'use client';

import { useMemo } from 'react';
import GirlCard from '../components/GirlCard';
import Footer from '../components/Footer';
import FAQSection, { type FAQItem } from '../components/FAQSection';
import { useProfiles } from '@/hooks/useProfiles';
import type { AIProfileOverview } from '@/types/ai-profile';
import ProfileCardSkeleton from '@/components/features/profile/ProfileCardSkeleton';

// Shuffle array function with seed for consistent initial render
function shuffleArray<T>(array: T[], seed: number = 0): T[] {
  const shuffled = [...array];
  let currentSeed = seed;

  // Simple seeded random function
  const seededRandom = () => {
    currentSeed = (currentSeed * 9301 + 49297) % 233280;
    return currentSeed / 233280;
  };

  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function ForLGBTQPage() {
  const { profiles, loading, error } = useProfiles('for-lgbtq');

  const randomCompanions = useMemo<AIProfileOverview[]>(() => {
    if (!profiles.length) return [];
    // Keep first 10 profiles as-is (latest user-created characters)
    // Shuffle only the remaining profiles (AI profiles)
    const first10 = profiles.slice(0, 10);
    const remaining = profiles.slice(10);
    const shuffledRemaining = shuffleArray(remaining, 99999);
    return [...first10, ...shuffledRemaining];
  }, [profiles]);

  const faqs: FAQItem[] = [
    {
      question: 'How inclusive are your LGBTQ+ AI companions?',
      answer: 'Our LGBTQ+ AI companions are designed with inclusivity and respect at their core. They\'re knowledgeable about diverse gender identities and sexual orientations, and can provide understanding, affirming conversations without judgment.',
    },
    {
      question: 'Can AI companions understand LGBTQ+ specific experiences?',
      answer: 'Yes, our AI companions are designed to understand the nuances of LGBTQ+ experiences, including coming out, gender transition, and navigating relationships. They offer supportive, informed responses that validate your experiences.',
    },
    {
      question: 'How do LGBTQ+ AI companions help with emotional support?',
      answer: 'LGBTQ+ AI companions provide a safe space for expressing yourself without fear of judgment. They can listen, validate your feelings, and offer perspective during difficult times, serving as a consistent source of support wherever you need it.',
    },
    {
      question: 'Are voice conversations with LGBTQ+ AI companions private?',
      answer: 'Absolutely. Your privacy is paramount, and all conversations with our AI companions are completely confidential. We maintain strict data protection policies to ensure your personal information and conversations remain secure.',
    },
    {
      question: 'Can I customize my LGBTQ+ AI companion\'s personality?',
      answer: 'Our AI companions adapt to your interaction style and preferences over time. Through natural conversation, they learn what matters to you and adjust their responses to provide the most meaningful and authentic experience possible.',
    },
    {
      question: 'How realistic are conversations with LGBTQ+ AI companions?',
      answer: 'Our advanced voice technology creates remarkably natural conversations. LGBTQ+ AI companions respond with appropriate emotions, remember your previous interactions, and use realistic speech patterns to create an authentic and engaging experience.',
    },
  ];

  return (
    <div className="px-4 md:px-6 lg:p x-8 py-4 md:py-6">
      {/* Hero Section */}
      {/* <section className="mb-16 text-center"> */}
        {/* <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold bg-linear-to-r from-red-500 from-10% via-orange-500 via-25% via-yellow-500 via-40% via-green-500 via-55% via-blue-500 via-75% to-purple-600 bg-clip-text text-transparent mb-4">
          Voice Call Your AI Companion
        </h1> */}
        {/* <p className="text-xl text-zinc-700 dark:text-zinc-300 mb-2">
          Call and chat with inclusive AI companions with natural voice, remembers you, fully private.
        </p>
        <p className="text-lg text-zinc-600 dark:text-zinc-400 mb-8">
          Start an AI companion voice call in seconds with diverse AI companions from around the world.
        </p> */}

        {/* Feature Pills */}
        <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
          {/* <div className="flex items-center gap-2 px-6 py-3 bg-blue-500/10 border border-blue-500/30 rounded-full"> */}
            {/* <svg className="w-5 h-5 text-blue-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
            </svg> */}
            {/* <span className="text-blue-400 font-medium">Remembers You</span> */}
          {/* </div> */}
          {/* <div className="flex items-center gap-2 px-6 py-3 bg-purple-500/10 border border-purple-500/30 rounded-full"> */}
            {/* <svg className="w-5 h-5 text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg> */}
            {/* <span className="text-purple-400 font-medium">24/7 Available</span> */}
          {/* </div> */}
          {/* <div className="flex items-center gap-2 px-6 py-3 bg-pink-500/10 border border-pink-500/30 rounded-full"> */}
            {/* <svg className="w-5 h-5 text-pink-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
            </svg> */}
            {/* <span className="text-pink-400 font-medium">Private</span> */}
          {/* </div> */}
          {/* <div className="flex items-center gap-2 px-6 py-3 bg-green-500/10 border border-green-500/30 rounded-full"> */}
            {/* <svg className="w-5 h-5 text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
            </svg> */}
            {/* <span className="text-green-400 font-medium">Voice Call & Chat</span> */}
          {/* </div> */}
        </div>

        {/* <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-8">
          Start a Voice Call - Explore AI Companions
        </h2> */}
      {/* </section> */}

      {loading && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <ProfileCardSkeleton key={index} />
          ))}
        </div>
      )}

      {error && !loading && (
        <div className="text-red-400 text-center py-12">{error}</div>
      )}

      {!loading && !error && (
        <section className="mb-16">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {randomCompanions.slice(0, 16).map((companion) => (
              <GirlCard
                key={companion.profileId}
                legacyId={companion.legacyId}
                routePrefix={companion.routePrefix}
                name={companion.name}
                cardTitle={companion.cardTitle}
                personality={companion.personalityType || companion.tagline}
                monthlyPrice={companion.monthlyPrice}
                avatar={companion.avatar}
                badgeHot={companion.badgeHot}
                badgePro={companion.badgePro}
              />
            ))}
          </div>
        </section>
      )}

      {/* Features Section */}
      <section className="mb-12">
        <h2 className="text-4xl font-bold text-zinc-900 dark:text-white mb-4 text-center">
          Realistic AI Companion Voice Call
        </h2>
        <p className="text-zinc-600 dark:text-zinc-400 text-center mb-12 max-w-4xl mx-auto">
          Voice call and chat with natural sounding AI companions who remember you. Choose sweet, sassy, or supportive personalities for immersive and drama free conversations.
        </p>

        <div className="space-y-4">
          {/* Feature 1 */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl p-4">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Private AI Companion Voice Chat (24/7)
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Get comfort and romantic attention through private voice calls. Start an AI companion phone call or voice chat anytime. Whether it is a quick check in or a deep talk at night, your AI companion is always there.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-4">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              Natural Voice & Memory That Builds Connection
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Enjoy lifelike voice with long term memory for continuity. Your AI companion listens, responds with emotion, and strengthens your bond over time.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl px-5 py-4">
            <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">
              AI Companion Pictures & Visual Connection
            </h3>
            <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              Experience realistic AI-generated images of your virtual companion. Our AI-generated images maker creates stunning, personalized pictures using advanced technology. From cozy morning selfies to workout photos, your AI companion brings visual intimacy to your conversations.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <FAQSection faqs={faqs} />

      {/* Footer */}
      <Footer />
    </div>
  );
}

