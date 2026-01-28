'use client';

import { useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import PricingModal from '../../components/PricingModal';
import { useProfileDetail } from '@/hooks/useProfileDetail';
import { extractLegacyIdFromSlug } from '@/lib/url-helpers';

export default function CharacterDetailPage() {
  const params = useParams();
  const slug = params.id as string | undefined;

  // Extract the ID (MongoDB ObjectId) from the slug
  // Example: "My-Char-69789009e1da83ed124d3ab5" -> "69789009e1da83ed124d3ab5"
  const legacyId = slug ? (extractLegacyIdFromSlug(slug) ?? undefined) : undefined;

  const { profile, loading, error } = useProfileDetail('character', legacyId);
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'bio' | 'features'>('bio');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const highlightCards = useMemo(() => {
    if (!profile) return [];
    
    // Create 3 specific cards for user characters
    const cards = [
      {
        title: "Personality & Vibe",
        description: profile.personalityType || `${profile.name} has a unique and engaging personality waiting for you to discover.`
      },
      {
        title: "Scenario & Backstory",
        description: profile.backstoryElements?.[0] || profile.bio || `${profile.name} is ready to create a new story with you.`
      },
      {
        title: "Interests & Topics",
        description: profile.topicPreferences && profile.topicPreferences.length > 0 
          ? `Loves talking about ${profile.topicPreferences.join(', ')}.`
          : `${profile.name} is open to discussing anything you have on your mind.`
      }
    ];

    return cards;
  }, [profile]);

  const handleStartChat = () => {
    if (!profile) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Failed to persist selected AI profile for chat:', error);
    }

    router.push(`/messages?ai=${profile.profileId}`);
  };

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          {/* Image Skeleton */}
          <div className="relative rounded-2xl overflow-hidden aspect-3/4 bg-zinc-200 dark:bg-zinc-800/50"></div>
          
          {/* Info Skeleton */}
          <div className="space-y-4">
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg w-3/4"></div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg w-1/2"></div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-40"></div>
              {/* <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-40"></div> */}
            </div>
            <div className="h-64 bg-zinc-200 dark:bg-zinc-800/50 rounded-2xl mt-6"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Character Not Found</h1>
          <p className="text-zinc-600 dark:text-zinc-400">The character you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const primaryPhoto = profile.photos?.[0] ?? profile.avatar;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 md:gap-8 mb-8 md:mb-12">
        {/* Image Section */}
        <div className="relative mx-auto lg:mx-0">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10">
            <img
              src={primaryPhoto}
              alt={profile.name}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Info Section */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-2">
                {profile.name}
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">{profile.cardTitle}</p>
              
              <div className="flex items-center gap-2 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-500 text-sm font-semibold">Online</span>
              </div>
            </div>
          </div>

          {/* Action Buttons - Removed Pricing for free characters */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 items-center sm:items-stretch">
            <button
              onClick={handleStartChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all text-sm md:text-base w-full sm:w-auto"
            >
              Connect Now
            </button>
          </div>

          {/* Character Profile Section */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Character Profile</h2>
              <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">• User Created</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-zinc-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab('bio')}
                className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'bio'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                👤 Bio
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'features'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                ⚙️ Features
              </button>
            </div>

            {/* Tab Content */}
            <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {activeTab === 'bio' && (
                <div className="space-y-4">
                  <p>{profile.bio}</p>
                </div>
              )}
              {activeTab === 'features' && (
                <div className="space-y-3">
                  <p className="font-semibold text-zinc-900 dark:text-white">Available Features:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                       <span className="text-purple-600 dark:text-purple-400">✓</span>
                       <span>{profile.personalityType || "Engaging Personality"}</span>
                    </li>
                    {profile.interests && profile.interests.length > 0 ? (
                      profile.interests.map((interest: string, idx: number) => (
                        <li key={idx} className="flex items-start gap-2">
                          <span className="text-purple-600 dark:text-purple-400">✓</span>
                          <span>{interest}</span>
                        </li>
                      ))
                    ) : (
                      <li className="text-sm text-zinc-500">No specific interests listed</li>
                    )}
                  </ul>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-zinc-600 dark:text-zinc-400 text-sm">
            <p className="mb-2">
              <span className="font-semibold text-zinc-900 dark:text-white">Category:</span> User Created
            </p>
            <p>
              <span className="font-semibold text-zinc-900 dark:text-white">Personality Type:</span> {profile.personalityType || "Unique"}
            </p>
          </div>
        </div>
      </div>

      {/* Description Section */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
          About {profile.name}
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
          {profile.bio}
        </p>
      </section>

      {/* Feature Cards Grid */}
      {highlightCards.length > 0 && (
          <section className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-4">
              {highlightCards.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-xl p-4 hover:border-zinc-300 dark:hover:border-white/20 transition-all"
                >
                  <h3 className="text-xl font-bold text-zinc-900 dark:text-white mb-3">{feature.title}</h3>
                  <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}
