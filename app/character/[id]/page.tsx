'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Footer from '../../components/Footer';
import { useProfileDetail } from '@/hooks/useProfileDetail';
import { extractLegacyIdFromSlug } from '@/lib/url-helpers';
import { useAuth } from '@/app/contexts/AuthContext';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

export default function CharacterDetailPage() {
  const params = useParams();
  const slug = params.id as string | undefined;
  const legacyId = slug ? (extractLegacyIdFromSlug(slug) ?? undefined) : undefined;

  const { profile, loading, error } = useProfileDetail('character', legacyId);
  const { user } = useAuth();
  const router = useRouter();

  const [activeTab, setActiveTab] = useState<'bio' | 'features'>('bio');

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
      // Check if current user already liked this character
      if (user && Array.isArray(p.likedBy)) {
        setLiked(p.likedBy.includes(user.id));
      }
    }
  }, [profile, user]);

  // Extract the raw MongoDB character ID from profileId  ("character-<id>")
  const characterId = useMemo(() => {
    if (!profile) return null;
    const pid = (profile as any).profileId as string;
    return pid?.startsWith('character-') ? pid.replace('character-', '') : null;
  }, [profile]);

  const handleLike = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!characterId || likeLoading) return;

    setLikeLoading(true);
    try {
      const res = await fetch(`/api/characters/${characterId}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked);
        setLikes(data.likes);
      }
    } catch (e) {
      console.error('Like failed:', e);
    } finally {
      setLikeLoading(false);
    }
  }, [user, characterId, likeLoading, router]);

  const handleStartChat = useCallback(async () => {
    if (!profile) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile));
      }
    } catch (e) {
      console.error('Failed to persist selected AI profile:', e);
    }

    // Fire-and-forget interaction increment
    if (characterId && user) {
      fetch(`/api/characters/${characterId}/interact`, {
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
  }, [profile, characterId, user, router]);

  const highlightCards = useMemo(() => {
    if (!profile) return [];
    return [
      {
        title: 'Personality & Vibe',
        description:
          profile.personalityType ||
          `${profile.name} has a unique and engaging personality waiting for you to discover.`,
      },
      {
        title: 'Scenario & Backstory',
        description:
          profile.backstoryElements?.[0] ||
          profile.bio ||
          `${profile.name} is ready to create a new story with you.`,
      },
      {
        title: 'Interests & Topics',
        description:
          profile.topicPreferences && profile.topicPreferences.length > 0
            ? `Loves talking about ${profile.topicPreferences.join(', ')}.`
            : `${profile.name} is open to discussing anything you have on your mind.`,
      },
    ];
  }, [profile]);

  if (loading) {
    return (
      <div className="px-4 md:px-6 lg:px-8 py-4 md:py-6 animate-pulse">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 mb-8 md:mb-12">
          <div className="relative rounded-2xl overflow-hidden aspect-3/4 bg-zinc-200 dark:bg-zinc-800/50"></div>
          <div className="space-y-4">
            <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg w-3/4"></div>
            <div className="h-6 bg-zinc-200 dark:bg-zinc-800/50 rounded-lg w-1/2"></div>
            <div className="flex gap-3 mt-6">
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-40"></div>
              <div className="h-12 bg-zinc-200 dark:bg-zinc-800/50 rounded-xl w-36"></div>
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
        {/* Image */}
        <div className="relative mx-auto lg:mx-0">
          <div className="relative rounded-2xl overflow-hidden aspect-[3/4] bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10">
            <img src={primaryPhoto} alt={profile.name} className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Info */}
        <div>
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-zinc-900 dark:text-white mb-2">
                {profile.name}
              </h1>
              <p className="text-xl text-zinc-600 dark:text-zinc-400 mb-2">{profile.personalityType}</p>
              <div className="flex items-center gap-2 mt-4">
                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-green-600 dark:text-green-500 text-sm font-semibold">Online</span>
              </div>
            </div>
          </div>

          {/* ── Engagement Stats ── */}
          <div className="flex items-center gap-6 mb-6">
            {/* Interactions */}
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                {formatCount(interactions)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide uppercase">
                Interactions
              </span>
            </div>

            <div className="w-px h-10 bg-zinc-200 dark:bg-white/10"></div>

            {/* Likes */}
            <div className="flex flex-col items-center">
              <span className="text-2xl font-bold text-zinc-900 dark:text-white">
                {formatCount(likes)}
              </span>
              <span className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5 tracking-wide uppercase">
                Likes
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 md:gap-4 mb-6 items-center sm:items-stretch">
            {/* Connect / Chat */}
            <button
              onClick={handleStartChat}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 md:px-8 py-3 rounded-xl font-semibold transition-all text-sm md:text-base w-full sm:w-auto"
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
                className={`w-5 h-5 transition-transform ${likeLoading ? '' : 'group-hover:scale-110'} ${liked ? 'scale-110' : ''}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12Z"
                />
              </svg>
              {liked ? 'Liked' : 'Like'}
            </button>
          </div>

          {/* Character Profile Card */}
          <div className="bg-white/60 dark:bg-zinc-900/30 backdrop-blur-xl border border-zinc-200 dark:border-white/10 rounded-2xl p-4 mb-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">Character Profile</h2>
              <span className="text-purple-600 dark:text-purple-400 text-sm font-semibold">• User Created</span>
            </div>

            {/* Tabs */}
            <div className="flex gap-4 mb-6 border-b border-zinc-200 dark:border-white/10">
              <button
                onClick={() => setActiveTab('bio')}
                className={`pb-3 px-4 font-semibold transition-all ${
                  activeTab === 'bio'
                    ? 'text-zinc-900 dark:text-white border-b-2 border-purple-500'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                👤 Bio
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={`pb-3 px-4 font-semibold transition-all ${
                  activeTab === 'features'
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
                      <span>{profile.personalityType || 'Engaging Personality'}</span>
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
              <span className="font-semibold text-zinc-900 dark:text-white">Personality Type:</span>{' '}
              {profile.personalityType || 'Unique'}
            </p>
          </div>
        </div>
      </div>

      {/* About Section */}
      <section className="mb-8">
        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6">About {profile.name}</h2>
      </section>

      {/* Feature Cards */}
      {highlightCards.length > 0 && (
        <section className="mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

      <Footer />
    </div>
  );
}
