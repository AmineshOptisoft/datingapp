'use client';

import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import Footer from '../../components/Footer';
import PricingModal from '../../components/PricingModal';
import { FaPlay } from 'react-icons/fa';
import { useProfileDetail } from '@/hooks/useProfileDetail';

export default function CompanionDetailPage() {
  const params = useParams();
  const legacyId = params.id as string | undefined;
  const { profile, loading, error } = useProfileDetail('companion', legacyId);

  const [activeTab, setActiveTab] = useState<'bio' | 'features' | 'pricing'>('bio');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);

  const highlightCards = useMemo(() => {
    if (!profile) return [];
    const titles = profile.personalityQuirks.slice(0, 4);
    const descriptions = [
      ...profile.backstoryElements,
      ...profile.topicPreferences,
    ];
    return titles.map((title, index) => ({
      title,
      description:
        descriptions[index] ||
        `${profile.name} loves creating rituals around ${profile.topicPreferences[0] ?? 'soft conversations'}.`,
    }));
  }, [profile]);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Loading profile...</h1>
          <p className="text-zinc-400">Hang tight while we fetch your AI companion.</p>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex h-screen items-center justify-center bg-zinc-950 text-white">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">Profile Not Found</h1>
          <p className="text-zinc-400">The AI companion you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const priceLabel = `$${profile.monthlyPrice.toFixed(2)}`;
  const primaryPhoto = profile.photos?.[0] ?? profile.avatar;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
            {/* Hero Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
              {/* Image Section */}
              <div className="relative">
                <div className="relative rounded-2xl overflow-hidden aspect-3/4 bg-zinc-900/30 backdrop-blur-xl border border-white/10">
                  <img
                    src={primaryPhoto}
                    alt={profile.name}
                    className="w-full h-full object-cover"
                  />
                  {profile.badgeHot && (
                    <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-xs font-semibold flex items-center gap-1">
                      🔥 HOT
                    </div>
                  )}
                  {profile.badgePro && (
                    <div className="absolute top-4 right-4 bg-purple-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                      PRO
                    </div>
                  )}
                </div>

                {/* Navigation Arrows */}
                <button className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                <button className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-3 rounded-full backdrop-blur-sm transition-all">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>

              {/* Info Section */}
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-2">
                      {profile.name} – {profile.cardTitle}
                    </h1>
                    <div className="flex items-center gap-2 mt-4">
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                      <span className="text-green-500 text-sm font-semibold">Online</span>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6">
                  <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base">
                    <FaPlay className="w-4 h-4" />
                    Start Free Trial
                  </button>
                  <button 
                    onClick={() => setIsPricingModalOpen(true)}
                    className="bg-pink-600 hover:bg-pink-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all text-sm md:text-base"
                  >
                    Buy Monthly @ {priceLabel}
                  </button>
                </div>

                {/* Character Profile Section */}
                <div className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 mb-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-white">Character Profile</h2>
                    <span className="text-purple-400 text-sm font-semibold">• Evolving Character</span>
                  </div>

                  {/* Tabs */}
                  <div className="flex gap-4 mb-6 border-b border-white/10">
                    <button
                      onClick={() => setActiveTab('bio')}
                      className={`pb-3 px-4 font-semibold transition-all ${
                        activeTab === 'bio'
                          ? 'text-white border-b-2 border-purple-500'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      👤 Bio
                    </button>
                    <button
                      onClick={() => setActiveTab('features')}
                      className={`pb-3 px-4 font-semibold transition-all ${
                        activeTab === 'features'
                          ? 'text-white border-b-2 border-purple-500'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      ⚙️ Features
                    </button>
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`pb-3 px-4 font-semibold transition-all ${
                        activeTab === 'pricing'
                          ? 'text-white border-b-2 border-purple-500'
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      💰 Pricing
                    </button>
                  </div>

                  {/* Tab Content */}
                  <div className="text-zinc-300 leading-relaxed">
                    {activeTab === 'bio' && (
                      <div className="space-y-4">
                        <p>{profile.bio}</p>
                        <p>{profile.lookingFor}</p>
                      </div>
                    )}
                    {activeTab === 'features' && (
                      <div className="space-y-3">
                        <p className="font-semibold text-white">Available Features:</p>
                        <ul className="space-y-2">
                          <li className="flex items-start gap-2">
                            <span className="text-purple-400">✓</span>
                            <span>{profile.conversationStyle}</span>
                          </li>
                          {profile.topicPreferences.slice(0, 3).map((topic) => (
                            <li key={topic} className="flex items-start gap-2">
                              <span className="text-purple-400">✓</span>
                              <span>{topic}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {activeTab === 'pricing' && (
                      <div className="space-y-4">
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold">Monthly Subscription</span>
                            <span className="text-2xl font-bold text-purple-400">{priceLabel}</span>
                          </div>
                          <p className="text-sm text-zinc-400">Full access to all features and unlimited conversations</p>
                        </div>
                        <div className="bg-zinc-800/50 rounded-xl p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-white font-semibold">Free Trial</span>
                            <span className="text-2xl font-bold text-green-400">$0.00</span>
                          </div>
                          <p className="text-sm text-zinc-400">Try for free with limited features</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Additional Info */}
                <div className="text-zinc-400 text-sm">
                  <p className="mb-2">
                    <span className="font-semibold text-white">Category:</span> {profile.category}
                  </p>
                  <p>
                    <span className="font-semibold text-white">Personality Type:</span> {profile.cardTitle}
                  </p>
                </div>
              </div>
            </div>

            {/* Description Section */}
            <section className="mb-12">
              <h2 className="text-3xl font-bold text-white mb-6">
                {profile.name} - Your {profile.cardTitle.toLowerCase()}.
              </h2>
              <p className="text-zinc-300 leading-relaxed text-lg">
                {profile.bio}
              </p>
            </section>

            {/* Feature Cards Grid */}
            <section className="mb-12">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                {highlightCards.map((feature, index) => (
                  <div
                    key={index}
                    className="bg-zinc-900/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all"
                  >
                    <h3 className="text-xl font-bold text-white mb-3">{feature.title}</h3>
                    <p className="text-zinc-400 leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </section>

      {/* Pricing Modal */}
      <PricingModal 
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        profileImage={primaryPhoto}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}

