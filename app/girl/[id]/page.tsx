'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import PricingModal from '../../components/PricingModal';
import { FaPlay } from 'react-icons/fa';
import { useProfileDetail } from '@/hooks/useProfileDetail';
import { extractLegacyIdFromSlug } from '@/lib/url-helpers';
import { GIFTS } from '@/lib/constants/gifts';
import { PiCoinsFill } from 'react-icons/pi';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GirlDetailPage() {
  const params = useParams();
  const slug = params.id as string | undefined;

  // Extract the legacy ID from the SEO-friendly slug
  // Example: "Hinata-The-Shy-AI-Girlfriend-424" -> "424"
  const legacyId = slug ? (extractLegacyIdFromSlug(slug) ?? undefined) : undefined;

  const { profile, loading, error } = useProfileDetail('girl', legacyId);
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'bio' | 'features' | 'pricing'>('bio');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);

  // Engagement state
  const [likes, setLikes] = useState(0);
  const [interactions, setInteractions] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);

  // Sync engagement counts from profile once loaded
  useEffect(() => {
    if (profile) {
      const p = profile as any;
      setLikes(p.likes ?? 0);
      setInteractions(p.interactions ?? 0);
      if (user && Array.isArray(p.likedBy)) {
        setLiked(p.likedBy.includes(user.id));
      }
    }
  }, [profile, user]);

  // Fetch gifts for this AI profile
  useEffect(() => {
    if (profile) {
      const pid = (profile as any).profileId;
      if (pid) {
        fetch(`/api/characters/${pid}/gifts`)
          .then(res => res.json())
          .then(data => {
            if (data.success && data.gifts) {
              setGifts(data.gifts);
            }
          })
          .catch(console.error);
      }
    }
  }, [profile]);

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
        `${profile.name} loves talking about ${profile.topicPreferences[0] ?? 'life stories'}.`,
    }));
  }, [profile]);

  const handleLike = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!profile || likeLoading) return;

    const aiId = (profile as any)._id;
    if (!aiId) return;

    // Optimistic update – flip UI instantly
    const prevLiked = liked;
    const prevLikes = likes;
    const newLiked = !liked;
    setLiked(newLiked);
    setLikes(prev => prev + (newLiked ? 1 : -1));
    setLikeLoading(true);

    try {
      const res = await fetch(`/api/characters/${aiId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikes(data.likes);
      } else {
        setLiked(prevLiked);
        setLikes(prevLikes);
      }
    } catch (e) {
      console.error('Like failed:', e);
      setLiked(prevLiked);
      setLikes(prevLikes);
    } finally {
      setLikeLoading(false);
    }
  }, [user, profile, likeLoading, liked, likes, router]);

  const handleStartChat = useCallback(() => {
    if (!profile) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile));
      }
    } catch (error) {
      console.error('Failed to persist selected AI profile for chat:', error);
    }

    // Fire-and-forget interaction increment
    const aiId = (profile as any)._id;
    if (aiId && user) {
      fetch(`/api/characters/${aiId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      })
        .then((r) => r.json())
        .then((d) => {
          if (d.success) setInteractions(d.interactions);
        })
        .catch(() => {});
    }

    router.push(`/messages?ai=${profile.profileId}`);
  }, [profile, user, router]);

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
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-40"></div>
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
          <h1 className="text-4xl font-bold mb-4 text-zinc-900 dark:text-white">Profile Not Found</h1>
          <p className="text-zinc-600 dark:text-zinc-400">The AI girlfriend you're looking for doesn't exist.</p>
        </div>
      </div>
    );
  }

  const priceLabel = `$${profile.monthlyPrice.toFixed(2)}`;
  const primaryPhoto = profile.photos?.[0] ?? profile.avatar;

  return (
    <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6">
      {/* Hero Section */}
      <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6 md:gap-8 mb-8 md:mb-12">
        {/* Image Section */}
        <div className="relative mx-auto lg:mx-0">
          <div className="relative rounded-2xl overflow-hidden h-full bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10">
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
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-2">
                {profile.name} – {profile.cardTitle}
              </h1>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-500 text-sm font-semibold">Online</span>
              </div>
            </div>
          </div>

          {/* ── Engagement Stats ── */}
          <div className="flex items-center gap-6 mb-6">
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                {interactions >= 1000 ? `${(interactions / 1000).toFixed(1).replace(/\.0$/, '')}k` : interactions}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide uppercase">
                Interactions
              </span>
            </div>
            <div className="w-px h-10 bg-zinc-200 dark:bg-white/10"></div>
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                {likes >= 1000 ? `${(likes / 1000).toFixed(1).replace(/\.0$/, '')}k` : likes}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide uppercase">
                Likes
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 items-center sm:items-stretch">
            {/* <button
              onClick={() => router.push('/free-trial')}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all flex items-center justify-center gap-2 text-sm md:text-base"
            >
              <FaPlay className="w-4 h-4" />
              Start Free Trial
            </button> */}
            <button
              onClick={handleStartChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all text-sm md:text-base"
            >
              Connect Now
            </button>

            {/* Like Button */}
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className={`flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all text-sm md:text-base w-full sm:w-auto border-2 ${
                liked
                  ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600 hover:border-pink-600'
                  : 'bg-transparent border-zinc-300 dark:border-white/20 text-zinc-700 dark:text-zinc-300 hover:border-pink-400 hover:text-pink-500 dark:hover:border-pink-400 dark:hover:text-pink-400'
              } ${likeLoading ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill={liked ? 'currentColor' : 'none'}
                stroke="currentColor"
                strokeWidth={2}
                className={`w-5 h-5 transition-transform ${liked ? 'scale-110' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
              {liked ? 'Liked' : 'Like'}
            </button>

            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="bg-pink-600 hover:bg-pink-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all text-sm md:text-base"
            >
              Buy Monthly @ {priceLabel}
            </button>
          </div>

          {/* Character Profile Section */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Character Profile</h2>
              <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">• Evolving Character</span>
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
              <button
                onClick={() => setActiveTab('pricing')}
                className={`pb-3 px-4 font-semibold transition-all ${activeTab === 'pricing'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                  }`}
              >
                💰 Pricing
              </button>
            </div>

            {/* Tab Content */}
            <div className="text-zinc-700 dark:text-zinc-300 leading-relaxed">
              {activeTab === 'bio' && (
                <div className="space-y-4">
                  <p>{profile.bio}</p>
                  <p>{profile.lookingFor}</p>
                </div>
              )}
              {activeTab === 'features' && (
                <div className="space-y-3">
                  <p className="font-semibold text-zinc-900 dark:text-white">Available Features:</p>
                  <ul className="space-y-2">
                    <li className="flex items-start gap-2">
                      <span className="text-purple-600 dark:text-purple-400">✓</span>
                      <span>{profile.conversationStyle}</span>
                    </li>
                    {profile.topicPreferences.slice(0, 3).map((topic) => (
                      <li key={topic} className="flex items-start gap-2">
                        <span className="text-purple-600 dark:text-purple-400">✓</span>
                        <span>{topic}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {activeTab === 'pricing' && (
                <div className="space-y-4">
                  <div className="bg-zinc-200 dark:bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-900 dark:text-white font-semibold">Monthly Subscription</span>
                      <span className="text-2xl font-bold text-purple-600 dark:text-purple-400">{priceLabel}</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Full access to all features and unlimited conversations</p>
                  </div>
                  <div className="bg-zinc-200 dark:bg-zinc-800/50 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-zinc-900 dark:text-white font-semibold">Free Trial</span>
                      <span className="text-2xl font-bold text-green-600 dark:text-green-400">$0.00</span>
                    </div>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">Try for free with limited features</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Additional Info */}
          <div className="text-zinc-600 dark:text-zinc-400 text-sm">
            <p className="mb-2">
              <span className="font-semibold text-zinc-900 dark:text-white">Category:</span> {profile.category}
            </p>
            <p>
              <span className="font-semibold text-zinc-900 dark:text-white">Personality Type:</span> {profile.cardTitle}
            </p>
          </div>
        </div>
      </div>

      {/* Gifts Received Section */}
      {gifts.length > 0 && (
        <section className="mb-8">
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-4">
            <h2 className="text-2xl font-bold text-zinc-900 dark:text-white mb-6">Gifts Received</h2>
            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
              {gifts.map((gift, idx) => {
                const giftRef = GIFTS.find(g => g.name === gift.giftName);
                if (!giftRef) return null;
                return (
                  <div key={idx} className="relative flex flex-col items-center min-w-[120px] p-4 rounded-xl bg-white dark:bg-zinc-800/80 border border-zinc-200 dark:border-white/5 shadow-sm snap-center hover:scale-105 transition-transform cursor-pointer">
                    <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full shadow-md flex items-center gap-0.5 z-10">
                      <PiCoinsFill className="w-3 h-3" />
                      {giftRef.price}
                    </div>
                    <img src={giftRef.image} alt={gift.giftName} className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
                    <div className="flex flex-col items-center gap-1 w-full justify-center mt-auto">
                      <img src={gift.sender.avatar} alt={gift.sender.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-purple-500/50" />
                      <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-300 truncate max-w-[90px]" title={gift.sender.name}>{gift.sender.name}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Description Section */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">
          {profile.name} - Your {profile.cardTitle.toLowerCase()}.
        </h2>
        <p className="text-zinc-700 dark:text-zinc-300 leading-relaxed text-lg">
          {profile.bio}
        </p>
      </section>

      {/* Feature Cards Grid */}
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

      {/* Pricing Modal */}
      <PricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        profileImage={primaryPhoto}
        aiProfileId={(profile as any).profileId}
        aiProfileName={profile.name}
        pricing={(profile as any).pricing}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
