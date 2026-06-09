'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Film, Play, User, Heart, MessageSquare, ChevronLeft } from 'lucide-react';
import Footer from '../../components/Footer';
import { useProfileDetail } from '@/hooks/useProfileDetail';
import { extractLegacyIdFromSlug } from '@/lib/url-helpers';
import { useAuth } from '@/app/contexts/AuthContext';
import { GIFTS } from '@/lib/constants/gifts';
import { PiCoinsFill } from "react-icons/pi";

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
      setInteractions(p.interactions ?? 0);

      const dbCharacterId = p.profileId?.startsWith('character-')
        ? p.profileId.replace('character-', '')
        : p._id || p.id;

      // Determine liked state first
      let isLiked = false;
      if (typeof window !== 'undefined') {
        const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
        if (dbCharacterId && likedList.includes(dbCharacterId)) {
          isLiked = true;
        }
      }

      if (!isLiked && user && Array.isArray(p.likedBy)) {
        isLiked = p.likedBy.includes(user.id);
        if (isLiked && dbCharacterId && typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (!likedList.includes(dbCharacterId)) {
            likedList.push(dbCharacterId);
            localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
          }
        }
      }

      setLiked(isLiked);

      // If user has liked this profile but server reports 0, show at least 1
      const serverLikes = p.likes ?? 0;
      setLikes(isLiked && serverLikes === 0 ? 1 : serverLikes);
    }
  }, [profile, user]);

  // Listen to global like updates
  useEffect(() => {
    if (!profile) return;
    const dbCharacterId = profile.profileId?.startsWith('character-') 
      ? profile.profileId.replace('character-', '') 
      : (profile as any)._id || (profile as any).id;
    if (!dbCharacterId) return;

    const handleLikeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterId: updatedId, liked: newLiked, likes: newLikes } = customEvent.detail;
      if (updatedId === dbCharacterId) {
        setLiked(newLiked);
        if (newLikes !== undefined) {
          setLikes(newLikes);
        }
      }
    };
    window.addEventListener('lily:like-updated', handleLikeUpdate);
    return () => window.removeEventListener('lily:like-updated', handleLikeUpdate);
  }, [profile]);

  const [gifts, setGifts] = useState<any[]>([]);

  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);
  const [characterScenes, setCharacterScenes] = useState<any[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);

  useEffect(() => {
    if (profile?.photos?.[0]) {
      setSelectedPhoto(profile.photos[0]);
    }
  }, [profile]);

  // Extract the raw MongoDB character ID from profileId
  const characterId = useMemo(() => {
    if (!profile) return null;
    const pid = (profile as any).profileId as string;
    return pid?.startsWith('character-') ? pid.replace('character-', '') : null;
  }, [profile]);

  // Fetch gifts in parallel
  useEffect(() => {
    if (!legacyId) return;
    fetch(`/api/characters/${legacyId}/gifts`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.gifts) {
          setGifts(data.gifts);
        }
      })
      .catch(console.error);
  }, [legacyId]);

  // Fetch scenes in parallel
  useEffect(() => {
    if (!legacyId) return;
    const fetchScenes = async () => {
      try {
        setLoadingScenes(true);
        const res = await fetch(`/api/scenes?characterId=${legacyId}`);
        const data = await res.json();
        if (data.success) {
          setCharacterScenes(data.scenes || []);
        }
      } catch (error) {
        console.error("Error fetching character scenes:", error);
      } finally {
        setLoadingScenes(false);
      }
    };
    fetchScenes();
  }, [legacyId]);

  const handleLike = useCallback(async () => {
    if (!user) {
      router.push('/login');
      return;
    }
    if (!characterId || likeLoading) return;

    // Optimistic update
    const prevLiked = liked;
    const prevLikes = likes;
    const newLiked = !liked;
    setLiked(newLiked);
    const newLikesCount = Math.max(0, prevLikes + (newLiked ? 1 : -1));
    setLikes(newLikesCount);
    setLikeLoading(true);

    // Dispatch global event instantly
    window.dispatchEvent(new CustomEvent('lily:like-updated', {
      detail: { characterId, liked: newLiked, likes: newLikesCount }
    }));

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
        if (typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (data.liked) {
            if (!likedList.includes(characterId)) {
              likedList.push(characterId);
              localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
            }
          } else {
            const newList = likedList.filter((id: string) => id !== characterId);
            localStorage.setItem('lily:liked-profiles', JSON.stringify(newList));
          }
        }
        // Dispatch updated count from server
        window.dispatchEvent(new CustomEvent('lily:like-updated', {
          detail: { characterId, liked: data.liked, likes: data.likes }
        }));
      } else {
        setLiked(prevLiked);
        setLikes(prevLikes);
        window.dispatchEvent(new CustomEvent('lily:like-updated', {
          detail: { characterId, liked: prevLiked, likes: prevLikes }
        }));
      }
    } catch (e) {
      console.error('Like failed:', e);
      setLiked(prevLiked);
      setLikes(prevLikes);
      window.dispatchEvent(new CustomEvent('lily:like-updated', {
        detail: { characterId, liked: prevLiked, likes: prevLikes }
      }));
    } finally {
      setLikeLoading(false);
    }
  }, [user, characterId, likeLoading, liked, likes, router]);

  const handleStartChat = useCallback(async () => {
    if (!profile) return;
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile));
      }
    } catch (e) {
      console.error('Failed to persist selected AI profile:', e);
    }

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
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#040406] text-white px-4 md:px-8 py-8 animate-pulse">
        <div className="max-w-6xl mx-auto">
          <div className="h-6 bg-zinc-800 rounded-lg w-28 mb-6"></div>
          <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 mb-12">
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-900 border border-white/5"></div>
            <div className="space-y-6">
              <div className="h-14 bg-zinc-900 rounded-2xl w-3/4"></div>
              <div className="h-6 bg-zinc-900 rounded-lg w-1/3"></div>
              <div className="h-20 bg-zinc-900 rounded-2xl"></div>
              <div className="flex gap-4">
                <div className="h-14 bg-zinc-900 rounded-2xl w-44"></div>
                <div className="h-14 bg-zinc-900 rounded-2xl w-24"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] to-[#040406] text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-4xl font-extrabold mb-4 font-outfit">Character Not Found</h1>
          <p className="text-zinc-400 text-sm">The character you're looking for doesn't exist.</p>
          <button 
            onClick={() => router.push('/')}
            className="mt-6 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2.5 px-6 rounded-xl transition-all"
          >
            Go back Home
          </button>
        </div>
      </div>
    );
  }

  const primaryPhoto = selectedPhoto ?? profile.avatar;
  const galleryPhotos = profile.photos || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0a0a0f] via-[#0d0d14] to-[#040406] text-white px-4 md:px-8 py-8">
      <div className="max-w-6xl mx-auto">
        {/* Back Button */}
        <button
          onClick={() => router.back()}
          className="mb-8 flex items-center gap-2 text-zinc-400 hover:text-white transition-all group hover:scale-[1.02] active:scale-[0.98] select-none"
        >
          <ChevronLeft className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
          <span className="text-sm font-semibold tracking-wide">Back to Browse</span>
        </button>

        {/* Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 mb-12">
          {/* Gallery Column */}
          <div className="relative mx-auto lg:mx-0 space-y-4 w-full max-w-[400px] lg:max-w-none">
            <div className="relative rounded-3xl overflow-hidden aspect-[3/4] bg-zinc-950 border border-white/10 shadow-2xl hover:border-purple-500/30 transition-all duration-500 group">
              <img 
                src={primaryPhoto} 
                alt={profile.name} 
                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
            </div>

            {/* Thumbnail Gallery */}
            {galleryPhotos.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                {galleryPhotos.map((photo: string, idx: number) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedPhoto(photo)}
                    className={`relative flex-shrink-0 w-20 aspect-[3/4] rounded-xl overflow-hidden border-2 transition-all ${
                      primaryPhoto === photo
                        ? 'border-purple-500 scale-105 shadow-lg shadow-purple-500/20'
                        : 'border-transparent opacity-50 hover:opacity-100'
                    }`}
                  >
                    <img src={photo} alt={`${profile.name} ${idx + 1}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details Column */}
          <div className="space-y-6">
            {/* Header info */}
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white tracking-tight font-outfit">
                  {profile.name}
                </h1>
                {profile.age && (
                  <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-zinc-500 font-outfit">
                    , {profile.age}
                  </span>
                )}
              </div>
              
              <p className="text-xl text-purple-400 font-semibold mt-1.5">{profile.personalityType}</p>
              
              <div className="flex items-center gap-2 mt-4">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-500 text-sm font-bold uppercase tracking-wider">Online</span>
              </div>
            </div>

            {/* Stats Row */}
            <div className="flex gap-8 border-y border-white/5 py-5">
              <div>
                <div className="text-3xl font-extrabold text-white font-outfit">{formatCount(interactions)}</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Interactions</div>
              </div>
              <div className="w-px bg-white/10 my-1" />
              <div>
                <div className="text-3xl font-extrabold text-white font-outfit">{formatCount(likes)}</div>
                <div className="text-xs text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Likes</div>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center">
              <button
                onClick={handleStartChat}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 px-8 rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2.5 text-base sm:w-auto"
              >
                <MessageSquare className="w-5 h-5 fill-white/10" />
                Connect Now
              </button>

              <button
                onClick={handleLike}
                disabled={likeLoading}
                className={`flex items-center justify-center gap-2 px-6 py-4 rounded-2xl border-2 font-bold transition-all text-base sm:w-auto ${
                  liked
                    ? 'bg-pink-500/25 border-pink-500 text-pink-500 shadow-lg shadow-pink-500/10'
                    : 'border-white/10 text-zinc-400 hover:border-pink-500/50 hover:text-pink-500'
                }`}
              >
                <Heart className={`w-5 h-5 ${liked ? 'fill-pink-500' : ''}`} />
                {liked ? 'Liked' : 'Like'}
              </button>
            </div>

            {/* Bio Card */}
            <div className="bg-[#0f0f14]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-white tracking-tight font-outfit">Character Profile</h2>
                <span className="text-purple-400 text-sm font-bold">• User Created</span>
              </div>

              {/* Tabs header */}
              <div className="flex gap-6 mb-6 border-b border-white/5">
                <button
                  onClick={() => setActiveTab('bio')}
                  className={`pb-3 px-2 font-bold text-sm transition-all relative ${
                    activeTab === 'bio'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  👤 Bio
                </button>
                <button
                  onClick={() => setActiveTab('features')}
                  className={`pb-3 px-2 font-bold text-sm transition-all relative ${
                    activeTab === 'features'
                      ? 'text-white border-b-2 border-purple-500'
                      : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  ⚙️ Features
                </button>
              </div>

              {/* Tab contents */}
              <div className="text-zinc-300 leading-relaxed text-base min-h-[80px]">
                {activeTab === 'bio' && (
                  <p>{profile.bio || `${profile.name} is waiting for you to say hi and begin your chat.`}</p>
                )}
                {activeTab === 'features' && (
                  <div className="space-y-4">
                    <p className="font-semibold text-white">Available Features:</p>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <li className="flex items-center gap-2 text-zinc-300">
                        <span className="text-purple-500">✓</span>
                        <span>{profile.personalityType || 'Engaging Personality'}</span>
                      </li>
                      <li className="flex items-center gap-2 text-zinc-300">
                        <span className="text-purple-500">✓</span>
                        <span>Interactive Voice Response</span>
                      </li>
                      {profile.interests && profile.interests.length > 0 ? (
                        profile.interests.map((interest: string, idx: number) => (
                          <li key={idx} className="flex items-center gap-2 text-zinc-300 capitalize">
                            <span className="text-purple-500">✓</span>
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

            {/* Meta info */}
            <div className="text-zinc-500 text-sm space-y-1">
              <p>
                <span className="font-semibold text-zinc-400">Category:</span> User Created
              </p>
              <p>
                <span className="font-semibold text-zinc-400">Personality Type:</span>{' '}
                {profile.personalityType || 'Unique'}
              </p>
            </div>
          </div>
        </div>

        {/* Gifts Received Section */}
        {gifts.length > 0 && (
          <section className="mb-12">
            <div className="bg-[#0f0f14]/60 backdrop-blur-xl border border-white/5 rounded-3xl p-6 shadow-xl">
              <h2 className="text-2xl font-bold text-white mb-6 font-outfit">Gifts Received</h2>
              <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent snap-x">
                {gifts.map((gift, idx) => {
                  const giftRef = GIFTS.find(g => g.name === gift.giftName);
                  if (!giftRef) return null;
                  return (
                    <div key={idx} className="relative flex flex-col items-center min-w-[120px] p-4 rounded-2xl bg-white/5 border border-white/5 shadow-md snap-center hover:scale-105 hover:bg-white/10 transition-all select-none">
                      <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[10px] font-extrabold px-2 py-0.5 rounded-full shadow-md flex items-center gap-0.5 z-10">
                        <PiCoinsFill className="w-3.5 h-3.5" />
                        {giftRef.price}
                      </div>
                      <img src={giftRef.image} alt={gift.giftName} className="w-16 h-16 object-contain mb-3 drop-shadow-md" />
                      <div className="flex flex-col items-center gap-1.5 w-full mt-auto">
                        <img src={gift.sender.avatar} alt={gift.sender.name} className="w-6 h-6 rounded-full object-cover ring-2 ring-purple-500/50" />
                        <span className="text-xs font-semibold text-zinc-300 truncate max-w-[95px]" title={gift.sender.name}>{gift.sender.name}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </section>
        )}

        {/* Featured Scenes & Reels Section */}
        {(characterScenes.length > 0 || loadingScenes) && (
          <section className="mb-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-extrabold text-white flex items-center gap-2 font-outfit">
                <Film className="w-7 h-7 text-purple-500" />
                Featured Scenes & Reels
              </h2>
              {characterScenes.length > 0 && (
                <span className="text-zinc-500 text-sm font-semibold">{characterScenes.length} moments</span>
              )}
            </div>

            {loadingScenes ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-zinc-900 border border-white/5 animate-pulse" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {characterScenes.map((scene) => (
                  <div
                    key={scene._id}
                    className="group/scene relative aspect-[3/4] rounded-2xl overflow-hidden border border-white/5 bg-white/5 backdrop-blur-md shadow-lg hover:shadow-purple-500/5 hover:border-white/20 transition-all duration-300 cursor-pointer"
                    onMouseEnter={(e) => {
                      const video = e.currentTarget.querySelector('video');
                      if (video) video.play().catch(() => {});
                    }}
                    onMouseLeave={(e) => {
                      const video = e.currentTarget.querySelector('video');
                      if (video) {
                        video.pause();
                        video.currentTime = 0;
                      }
                    }}
                  >
                    {scene.mediaType === "image" ? (
                      <img
                        src={scene.mediaUrl}
                        alt={scene.sceneTitle}
                        className="w-full h-full object-cover group-hover/scene:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <video
                        src={scene.mediaUrl}
                        className="w-full h-full object-cover"
                        preload="metadata"
                        muted
                        playsInline
                      />
                    )}
                    
                    {/* Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent flex flex-col justify-end p-4 pointer-events-none">
                      <p className="text-white text-sm font-bold truncate">{scene.sceneTitle}</p>
                      <div className="flex flex-col gap-1 text-white/80 text-[10px] mt-1">
                        {scene.reelId ? (
                          <>
                            <div className="flex items-center gap-2">
                              <div className="flex items-center gap-0.5">
                                <Play className="w-2.5 h-2.5 fill-white/85" />
                                <span>{formatCount(scene.reelViewsCount || 0)}</span>
                              </div>
                              <div className="flex items-center gap-0.5">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-2.5 h-2.5 text-pink-500">
                                  <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
                                </svg>
                                <span>{formatCount(scene.reelLikesCount || 0)}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 text-white/50 italic">
                              {scene.userAvatar ? (
                                <img src={scene.userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-white/10" />
                              ) : (
                                <User className="w-3 h-3" />
                              )}
                              <span>By {scene.userName || 'Unknown'}</span>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-1 text-white/50 italic">
                            {scene.userAvatar ? (
                              <img src={scene.userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover border border-white/10" />
                            ) : (
                              <User className="w-3 h-3" />
                            )}
                            <span>By {scene.userName || 'Unknown'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {scene.mediaType === "video" && (
                      <div className="absolute top-3 right-3 p-1.5 bg-black/50 backdrop-blur-md rounded-lg border border-white/5">
                        <Film className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* Feature Highlights Grid */}
        {highlightCards.length > 0 && (
          <section className="mb-16 border-t border-white/5 pt-10">
            <h2 className="text-3xl font-extrabold text-white mb-6 font-outfit">Highlights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {highlightCards.map((feature, index) => (
                <div
                  key={index}
                  className="bg-[#0f0f14]/40 backdrop-blur-xl border border-white/5 rounded-2xl p-5 hover:border-purple-500/20 hover:bg-[#0f0f14]/60 transition-all duration-300"
                >
                  <h3 className="text-lg font-bold text-white mb-2 font-outfit">{feature.title}</h3>
                  <p className="text-zinc-400 text-sm leading-relaxed">{feature.description}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        <Footer />
      </div>
    </div>
  );
}
