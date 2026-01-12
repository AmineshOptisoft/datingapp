'use client';

import { useState, useEffect, Suspense, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import CategoryTabs from './components/CategoryTabs';
import GirlCard from './components/GirlCard';
import Footer from './components/Footer';
import { useProfiles } from '@/hooks/useProfiles';
import type { AIProfileOverview } from '@/types/ai-profile';
import ProfileCardSkeleton from '@/components/features/profile/ProfileCardSkeleton';

const DEFAULT_SEGMENT = 'for-men' as const;

function HomePageContent() {
  const searchParams = useSearchParams();
  const categoryParam = searchParams.get('category');
  const [activeCategory, setActiveCategory] = useState('All');
  const { profiles, loading, error } = useProfiles(DEFAULT_SEGMENT);

  useEffect(() => {
    if (categoryParam) {
      setActiveCategory(categoryParam);
    }
  }, [categoryParam]);

  const filteredProfiles = useMemo(() => {
    if (activeCategory === 'All') {
      return profiles;
    }
    return profiles.filter((profile) => profile.category === activeCategory);
  }, [profiles, activeCategory]);

  const groupedProfiles = useMemo(() => {
    return filteredProfiles.reduce<Record<string, AIProfileOverview[]>>((acc, profile) => {
      if (!acc[profile.category]) {
        acc[profile.category] = [];
      }
      acc[profile.category].push(profile);
      return acc;
    }, {});
  }, [filteredProfiles]);

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Category Tabs */}
      <div className="mb-8">
        <CategoryTabs activeCategory={activeCategory} onCategoryChange={setActiveCategory} />
      </div>

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

      {!loading && !error && Object.keys(groupedProfiles).length === 0 && (
        <div className="text-zinc-300 text-center py-12">
          No profiles found for this category.
        </div>
      )}

      {!loading && !error && Object.entries(groupedProfiles).map(([category, girls]) => (
        <section key={category} className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-zinc-900 dark:text-white">{category}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
            {girls.map((girl) => (
              <GirlCard
                key={girl.profileId}
                legacyId={girl.legacyId}
                routePrefix={girl.routePrefix}
                name={girl.name}
                cardTitle={girl.cardTitle}
                monthlyPrice={girl.monthlyPrice}
                avatar={girl.avatar}
                badgeHot={girl.badgeHot}
                badgePro={girl.badgePro}
              />
            ))}
          </div>
        </section>
      ))}

      {/* Additional Sections Before Footer */}

      {/* The Best AI Virtual Girlfriend App Section */}
      <section className="mb-16">
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

      {/* Idyll AI Companion Section */}
      <section className="mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-6 text-center">Idyll AI Companion</h2>

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
      <Footer />
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <HomePageContent />
    </Suspense>
  );
}
