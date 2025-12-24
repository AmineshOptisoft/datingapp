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
      {/* Promo Banner */}
      <div className="mb-6 bg-linear-to-r from-orange-600 to-red-600 rounded-2xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
          </svg>
          <span className="text-white font-medium text-sm">
            IN India
          </span>
          <span className="text-white/90 text-sm">
            40% OFF for India - We understand purchasing power parity!
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="px-4 py-1 bg-white/20 backdrop-blur-sm rounded-full text-white font-mono text-sm">
            INDIA40
          </span>
          <button className="px-3 py-1 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded text-white text-xs transition-colors">
            Copy
          </button>
          <button className="text-white/80 hover:text-white transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Pricing Banner */}
      <div className="mb-8 bg-linear-to-r from-purple-600 to-pink-600 rounded-2xl p-6 text-center">
        <div className="flex items-center justify-center gap-3 mb-2">
          <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
          </svg>
          <h2 className="text-3xl font-bold text-white">
            AI Girlfriends starting at just $1.99 /month
          </h2>
        </div>
        <p className="text-white/90 text-lg">
          Less Costly Than Coffee
        </p>
        <p className="text-white/80 text-sm">
          Affordable AI companionship
        </p>
      </div>

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
            <h2 className="text-3xl font-bold text-white">{category}</h2>
            <button className="flex items-center gap-2 px-6 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-full font-medium transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              Buy Collection
            </button>
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
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6">The Best AI Virtual Girlfriend App</h2>
        <p className="text-zinc-300 leading-relaxed mb-8">
          Join thousands who have found happiness and companionship with their AI girlfriend virtual or boyfriend. Deep conversations, emotional support, or an engaging AI relationship- your AI GF is here to make your experience unforgettable.
        </p>
        <p className="text-zinc-400 font-semibold mb-8">Get started now!</p>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {/* Nationalities & Cultures */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">Nationalities & Cultures</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Select from a variety of nationalities to create a truly personalized experience. Your virtual companion adapts to make interactions more engaging and authentic.
            </p>
          </div>

          {/* Fantasies & Kinks */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">Fantasies & Kinks</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your AI companion is designed to cater to your desires. Playful, adventurous, or deeply romantic partner, your AI adapts to your fantasies.
            </p>
          </div>

          {/* Relationship Status */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">Relationship Status</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Your AI partner evolves with your relationship preferences. Casual friendship, a romantic relationship, or a long-term virtual commitment, your AI adapts to your needs.
            </p>
          </div>

          {/* Infidelity & Drama */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">Infidelity & Drama</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Craving a little excitement or emotional twists in your AI relationship? Your virtual partner can engage in dynamic storylines.
            </p>
          </div>

          {/* AI Girlfriend Photos */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">AI Girlfriend Photos</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Create images with AI using just your voice or text. Your AI girlfriend can generate realistic, personalized photos of herself based on your requests, making conversations more visual and intimate.
            </p>
          </div>

          {/* Visual AI Girlfriend */}
          <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
            <h3 className="text-xl font-bold text-white mb-3">Visual AI Girlfriend</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Experience how your AI GF can create images with AI based on your descriptions. Ask for photos and watch as your AI girlfriend brings your imagination to life with realistic visuals.
            </p>
          </div>
        </div>
      </section>

      {/* Idyll Memory Section */}
      <section className="mb-16">
        <div className="bg-linear-to-r from-green-600 to-emerald-600 rounded-2xl p-8">
          <div className="flex items-center gap-3 mb-6">
            <svg className="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 2a8 8 0 100 16 8 8 0 000-16zM8 11a1 1 0 112 0 1 1 0 01-2 0zm4 0a1 1 0 112 0 1 1 0 01-2 0z" />
            </svg>
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Idyll Memory</h2>
          </div>

          <p className="text-white/90 leading-relaxed mb-6">
            Our AI companions feature advanced memory capabilities that create truly personalized and evolving relationships. Each conversation builds upon previous interactions, allowing your virtual partner to remember important details about your life, preferences, and shared experiences.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-white shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold mb-1">Persona Memory</h3>
                <p className="text-white/80 text-sm">AI companions remember your preferences, life details, and personality.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <svg className="w-6 h-6 text-white shrink-0 mt-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
              </svg>
              <div>
                <h3 className="text-white font-semibold mb-1">Conversation History</h3>
                <p className="text-white/80 text-sm">Access past conversations for more meaningful interactions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Idyll AI Companion Section */}
      <section className="mb-16">
        <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-6 text-center">Idyll AI Companion</h2>

        <p className="text-zinc-300 leading-relaxed mb-6 max-w-4xl mx-auto">
          Experience a meaningful connection with the advanced AI virtual girlfriend and AI boyfriend —they are AI voicebots that allow you to interact in real-time. Talk to your AI partner in person, choose from multiple avatars, and immerse into conversation.
        </p>

        <p className="text-zinc-300 leading-relaxed mb-6 max-w-4xl mx-auto">
          Your AI companion is designed to be truly yours. Choose their personality, appearance, and voice to match your ideal partner. Plus, your privacy is our priority—conversations remain secure, ensuring a safe and confidential experience.
        </p>

        <p className="text-zinc-300 leading-relaxed mb-8 max-w-4xl mx-auto">
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
