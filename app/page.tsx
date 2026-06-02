'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryTabs from './components/CategoryTabs';
import GirlCard from './components/GirlCard';
import Footer from './components/Footer';
import { useProfiles } from '@/hooks/useProfiles';
import type { AIProfileOverview } from '@/types/ai-profile';
import ScreenLoader from './components/ScreenLoader';

/**
 * Module-level flag — lives in JS memory.
 * Stays `true` across client-side navigation (Next.js keeps the module alive)
 * but resets to `false` on a true hard reload / new tab.
 * No async, no useEffect, no flash.
 */
let loaderHasPlayed = false;

function HomePageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState('All');

  // Read module-level flag synchronously — no useEffect, no async gap, no blank flash.
  // false = first load this session → show loader
  // true  = already played → skip loader immediately
  const [showLoader, setShowLoader] = useState(() => !loaderHasPlayed);

  // No segment = home page shows ALL profiles (male + female AI + all user characters)
  const { profiles, loading, error } = useProfiles();

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  // On the main screen, show ONLY character profiles (hide AI profiles).
  // AI profiles still appear on /for-men, /for-women, /for-lgbtq pages.
  const characterOnly = useMemo(
    () => profiles.filter((p) => p.routePrefix === 'character'),
    [profiles]
  );

  const filteredProfiles = useMemo(() => {
    if (activeCategory === 'All') {
      return characterOnly;
    }
    return characterOnly.filter((profile) => {
      // User-created characters: filter by tags (interests array)
      return profile.interests?.includes(activeCategory) ?? false;
    });
  }, [characterOnly, activeCategory]);

  // Safety cleanup: if the loader is skipped (navigation-back), ensure body styles
  // are never left in a locked state from any previous run or inline script.
  useEffect(() => {
    if (!showLoader) {
      document.documentElement.style.backgroundColor = '';
      document.body.style.backgroundColor = '';
      document.body.style.overflow = '';
    }
  }, [showLoader]);

  if (showLoader) {
    return <ScreenLoader onExited={() => {
      loaderHasPlayed = true;   // mark so every subsequent visit skips the loader
      setShowLoader(false);
    }} />;
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Category Tabs */}
      <div className="px-4 md:px-6 lg:px-8 pt-4 md:pt-6 pb-2">
        <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </div>

      {/* Profile Grid */}
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
        {error && !loading && (
          <div className="text-red-400 text-center py-12">{error}</div>
        )}

        {!loading && !error && filteredProfiles.length === 0 && (
          <div className="text-zinc-500 text-center py-20">
            <p className="text-lg font-medium">No profiles found for this category.</p>
          </div>
        )}

        {!loading && !error && filteredProfiles.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 md:gap-4">
            {filteredProfiles.map((girl) => (
              <GirlCard
                key={girl.profileId}
                _id={(girl as any)._id}
                legacyId={girl.legacyId}
                routePrefix={girl.routePrefix}
                name={girl.name}
                cardTitle={girl.cardTitle}
                personality={girl.personalityType || girl.tagline}
                monthlyPrice={girl.monthlyPrice}
                avatar={girl.avatar}
                badgeHot={girl.badgeHot}
                badgePro={girl.badgePro}
                likes={girl.likes}
                interactions={girl.interactions}
                age={girl.age}
                audienceSegment={girl.audienceSegment}
              />
            ))}

          </div>
        )}
      </div>

      {/* Additional Sections Before Footer */}

      {/* The Best AI Virtual Girlfriend App Section */}
      <section className="px-4 md:px-6 lg:px-8 mb-16 mt-8">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6">The Best AI Virtual Girlfriend App</h2>
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-8">
          Join thousands who have found happiness and companionship with their AI girlfriend virtual or boyfriend. Deep conversations, emotional support, or an engaging AI relationship- your AI GF is here to make your experience unforgettable.
        </p>
        <p className="text-zinc-600 dark:text-zinc-400 font-semibold mb-8">Get started now!</p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Nationalities & Cultures */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Nationalities & Cultures</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Select from a variety of nationalities to create a truly personalized experience. Your virtual companion adapts to make interactions more engaging and authentic.
            </p>
          </div>

          {/* Fantasies & Kinks */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Fantasies & Kinks</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Your AI companion is designed to cater to your desires. Playful, adventurous, or deeply romantic partner, your AI adapts to your fantasies.
            </p>
          </div>

          {/* Relationship Status */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Relationship Status</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Your AI partner evolves with your relationship preferences. Casual friendship, a romantic relationship, or a long-term virtual commitment, your AI adapts to your needs.
            </p>
          </div>

          {/* Infidelity & Drama */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Infidelity & Drama</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Craving a little excitement or emotional twists in your AI relationship? Your virtual partner can engage in dynamic storylines.
            </p>
          </div>

          {/* AI Girlfriend Photos */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">AI Girlfriend Photos</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Create images with AI using just your voice or text. Your AI girlfriend can generate realistic, personalized photos of herself based on your requests, making conversations more visual and intimate.
            </p>
          </div>

          {/* Visual AI Girlfriend */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-6 hover:border-zinc-300 dark:hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">Visual AI Girlfriend</h3>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
              Experience how your AI GF can create images with AI based on your descriptions. Ask for photos and watch as your AI girlfriend brings your imagination to life with realistic visuals.
            </p>
          </div>
        </div>
      </section>

      {/* Lily AI Companion Section */}
      <section className="flex flex-col items-center justify-center py-10 px-4 md:px-8 bg-zinc-50 dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6 text-center">Lily AI Companion</h2>

        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
          Experience a meaningful connection with the advanced AI virtual girlfriend and AI boyfriend —they are AI voicebots that allow you to interact in real-time. Talk to your AI partner in person, choose from multiple avatars, and immerse into conversation.
        </p>

        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
          Your AI companion is designed to be truly yours. Choose their personality, appearance, and voice to match your ideal partner. Plus, your privacy is our priority—conversations remain secure, ensuring a safe and confidential experience.
        </p>

        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed mb-6">
          Enjoy real-time voice conversations with your AI girlfriend or AI boyfriend, featuring multiple avatars from diverse nationalities and languages. Whether you seek companionship, emotional support, seduction, or engaging discussions, your AI adapts to your needs, offering a fully immersive voice-based experience that's available 24/7.
        </p>
      </section>

      {/* Footer */}
      <div className="px-4 md:px-6 lg:px-8">
        <Footer />
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={null}>
      <HomePageContent />
    </Suspense>
  );
}
