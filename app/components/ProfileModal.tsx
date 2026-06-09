'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Film, Play, User, Heart, MessageSquare } from 'lucide-react';
import { useProfileModal } from '@/app/contexts/ProfileModalContext';
import { useProfileDetail } from '@/hooks/useProfileDetail';
import { useProfiles } from '@/hooks/useProfiles';
import { useAuth } from '@/app/contexts/AuthContext';
import { GIFTS } from '@/lib/constants/gifts';
import { PiCoinsFill } from 'react-icons/pi';
import PricingModal from './PricingModal';

function formatCount(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace(/\.0$/, '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace(/\.0$/, '') + 'k';
  return n.toString();
}

export default function ProfileModal() {
  const router = useRouter();
  const pathname = usePathname();
  const { isOpen, routePrefix, legacyId, closeProfile, openProfile } = useProfileModal();
  
  // Get active profile detail
  const { profile, loading, error } = useProfileDetail(routePrefix || 'girl', legacyId || '');
  const { user } = useAuth();
  
  // Get similar profiles from the same segment for the recommendation grid
  const { profiles: allProfiles } = useProfiles(profile?.audienceSegment || null);

  const [activeTab, setActiveTab] = useState<'bio' | 'features' | 'pricing'>('bio');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [characterScenes, setCharacterScenes] = useState<any[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);

  // Engagement state
  const [likes, setLikes] = useState(0);
  const [interactions, setInteractions] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  // Reset indices, tabs, and loader when profile changes
  useEffect(() => {
    setActivePhotoIndex(0);
    setActiveTab('bio');
    setConnectLoading(false);
  }, [legacyId, routePrefix]);

  // Close modal once navigation to the messages page completes
  useEffect(() => {
    if (connectLoading && pathname?.startsWith('/messages')) {
      setConnectLoading(false);
      closeProfile();
    }
  }, [pathname, connectLoading, closeProfile]);

  // Sync engagement counts
  useEffect(() => {
    if (profile) {
      setInteractions(profile.interactions ?? 0);

      const dbCharacterId = profile.profileId?.startsWith('character-')
        ? profile.profileId.replace('character-', '')
        : (profile as any)._id || (profile as any).id;

      // Determine liked state first (localStorage takes priority as source of truth for this user)
      let isLiked = false;
      if (typeof window !== 'undefined') {
        const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
        if (dbCharacterId && likedList.includes(dbCharacterId)) {
          isLiked = true;
        }
      }

      if (!isLiked && user && Array.isArray(profile.likedBy)) {
        isLiked = profile.likedBy.includes(user.id);
        if (isLiked && dbCharacterId && typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (!likedList.includes(dbCharacterId)) {
            likedList.push(dbCharacterId);
            localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
          }
        }
      }

      setLiked(isLiked);

      // If user has liked this profile but server reports 0 likes, show at least 1
      const serverLikes = profile.likes ?? 0;
      setLikes(isLiked && serverLikes === 0 ? 1 : serverLikes);
    }
  }, [profile, user]);

  // Listen to global like updates
  useEffect(() => {
    if (!profile) return;
    const dbCharacterId = profile.profileId?.startsWith('character-') 
      ? profile.profileId.replace('character-', '') 
      : (profile as any)._id || (profile as any).id;

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

  // Fetch gifts & scenes in parallel
  useEffect(() => {
    if (!legacyId || !isOpen) return;
    
    // Construct exact profileId depending on prefix
    const profileId = routePrefix === 'character' ? legacyId : `${routePrefix}-${legacyId}`;
    
    // Fetch gifts
    fetch(`/api/characters/${profileId}/gifts`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.gifts) {
          setGifts(data.gifts);
        } else {
          setGifts([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setGifts([]);
      });

    // Fetch scenes
    setLoadingScenes(true);
    fetch(`/api/scenes?characterId=${legacyId}`)
      .then(res => res.json())
      .then(data => {
        if (data.success && data.scenes) {
          setCharacterScenes(data.scenes);
        } else {
          setCharacterScenes([]);
        }
      })
      .catch((e) => {
        console.error(e);
        setCharacterScenes([]);
      })
      .finally(() => {
        setLoadingScenes(false);
      });
  }, [legacyId, routePrefix, isOpen]);

  // Extract photos list
  const photos = useMemo(() => {
    if (!profile) return [];
    const gallery = profile.photos || [];
    if (gallery.length === 0 && profile.avatar) {
      return [profile.avatar];
    }
    return gallery;
  }, [profile]);

  const activePhoto = photos[activePhotoIndex] || profile?.avatar || '';

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1));
  };

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActivePhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0));
  };

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) {
      closeProfile();
      router.push('/login');
      return;
    }
    
    const dbCharacterId = profile?.profileId?.startsWith('character-') 
      ? profile.profileId.replace('character-', '') 
      : (profile as any)._id || (profile as any).id;
      
    if (!dbCharacterId || likeLoading) return;

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
      detail: { characterId: dbCharacterId, liked: newLiked, likes: newLikesCount }
    }));

    try {
      const res = await fetch(`/api/characters/${dbCharacterId}/like`, {
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
            if (!likedList.includes(dbCharacterId)) {
              likedList.push(dbCharacterId);
              localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
            }
          } else {
            const newList = likedList.filter((id: string) => id !== dbCharacterId);
            localStorage.setItem('lily:liked-profiles', JSON.stringify(newList));
          }
        }
        // Dispatch updated count from server
        window.dispatchEvent(new CustomEvent('lily:like-updated', {
          detail: { characterId: dbCharacterId, liked: data.liked, likes: data.likes }
        }));
      } else {
        setLiked(prevLiked);
        setLikes(prevLikes);
        window.dispatchEvent(new CustomEvent('lily:like-updated', {
          detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes }
        }));
      }
    } catch (err) {
      console.error('Like failed:', err);
      setLiked(prevLiked);
      setLikes(prevLikes);
      window.dispatchEvent(new CustomEvent('lily:like-updated', {
        detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes }
      }));
    } finally {
      setLikeLoading(false);
    }
  }, [user, profile, likeLoading, liked, likes, router, closeProfile]);

  const handleStartChat = useCallback(async () => {
    if (!profile) return;
    setConnectLoading(true);
    try {
      if (typeof window !== 'undefined') {
        window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile));
      }
    } catch (e) {
      console.error('Failed to persist selected AI profile:', e);
    }

    const dbCharacterId = profile.profileId?.startsWith('character-') 
      ? profile.profileId.replace('character-', '') 
      : (profile as any)._id || (profile as any).id;

    if (dbCharacterId && user) {
      fetch(`/api/characters/${dbCharacterId}/interact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id }),
      }).catch(() => {});
    }

    router.push(`/messages?ai=${profile.profileId}`);
  }, [profile, user, router]);

  // Filter out current profile from similar profiles
  const similarProfiles = useMemo(() => {
    if (!profile || !allProfiles) return [];
    return allProfiles
      .filter(p => {
        const isSelf = p.legacyId === profile.legacyId && p.routePrefix === profile.routePrefix;
        const matchesSegment = p.audienceSegment === profile.audienceSegment;
        return !isSelf && matchesSegment;
      })
      .slice(0, 6);
  }, [profile, allProfiles]);

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4 transition-all duration-300 animate-fade-in"
      onClick={closeProfile}
    >
      <div 
        className="relative max-w-3xl w-full max-h-[88vh] sm:max-h-[85vh] bg-[#0d0d12] border border-white/8 rounded-2xl overflow-hidden grid grid-cols-1 lg:grid-cols-[42%_58%] shadow-2xl animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={closeProfile}
          className="absolute top-3 right-3 z-50 bg-black/50 hover:bg-black/80 text-white rounded-full p-1.5 border border-white/10 hover:border-white/20 hover:scale-105 transition-all shadow-md"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Left Column: Image Slider */}
        <div className="relative w-full h-48 sm:h-64 lg:h-full bg-black/60 flex items-center justify-center overflow-hidden group select-none lg:min-h-0">
          {loading ? (
            <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
              <span className="text-zinc-500 text-xs">Loading Photos...</span>
            </div>
          ) : (
            <>
              <img 
                src={activePhoto} 
                alt={profile?.name || 'Profile'} 
                className="w-full h-full object-cover transition-all duration-500 scale-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-transparent to-transparent pointer-events-none" />

              {/* Slider Arrows */}
              {photos.length > 1 && (
                <>
                  <button 
                    onClick={handlePrevPhoto}
                    className="absolute left-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 hover:scale-110 text-white p-1.5 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={handleNextPhoto}
                    className="absolute right-3 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 hover:scale-110 text-white p-1.5 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {photos.length > 1 && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1 z-10 bg-black/40 px-2.5 py-1.5 rounded-full backdrop-blur-md border border-white/5">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        activePhotoIndex === idx ? 'bg-purple-500 scale-125' : 'bg-white/40 hover:bg-white/70'
                      }`}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Right Column: Scrollable Profile Info */}
        <div className="h-full max-h-[calc(88vh-12rem)] sm:max-h-[calc(85vh-12rem)] overflow-y-auto px-4 py-4 sm:px-5 sm:py-5 space-y-4">
          {loading ? (
            <div className="space-y-3 animate-pulse">
              <div className="h-7 bg-zinc-800 rounded-lg w-2/3"></div>
              <div className="h-4 bg-zinc-800 rounded-lg w-1/3"></div>
              <div className="h-16 bg-zinc-800 rounded-xl"></div>
              <div className="h-9 bg-zinc-800 rounded-xl w-1/2"></div>
            </div>
          ) : error || !profile ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-base font-semibold text-white">Profile Not Found</h3>
                <p className="text-zinc-500 text-xs mt-1">We couldn't retrieve this profile details.</p>
              </div>
            </div>
          ) : (
            <div className=''>
              {/* Profile Header */}
              <div>
                <div className="flex items-baseline gap-2 mb-0.5">
                  <h1 className="text-xl sm:text-2xl font-semibold text-white tracking-tight font-outfit">
                    {profile.name}
                  </h1>
                  {profile.age && (
                    <span className="text-lg sm:text-xl font-normal text-zinc-400 font-outfit">
                      {profile.age}
                    </span>
                  )}
                </div>
                
                <p className="text-xs text-purple-400 font-medium">{profile.personalityType || profile.cardTitle}</p>
                
                <div className="flex items-center gap-1.5 mt-1.5">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-500 text-[10px] font-semibold uppercase tracking-wider">Online</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex gap-5 border-y border-white/5 py-3">
                <div>
                  <div className="text-base font-bold text-white font-outfit">{formatCount(interactions)}</div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Interactions</div>
                </div>
                <div className="w-px bg-white/5 my-0.5" />
                <div>
                  <div className="text-base font-bold text-white font-outfit">{formatCount(likes)}</div>
                  <div className="text-[9px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Likes</div>
                </div>
              </div>

              {/* Call-to-actions */}
              <div className="flex gap-2">
                <button
                  onClick={handleStartChat}
                  disabled={connectLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl shadow-md hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-1.5 text-xs disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {connectLoading ? (
                    <>
                      <svg className="animate-spin h-3.5 w-3.5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-3.5 h-3.5 fill-white/10" />
                      Connect Now
                    </>
                  )}
                </button>

                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`px-3.5 py-2 rounded-xl border font-semibold flex items-center justify-center transition-all ${
                    liked
                      ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600 hover:border-pink-600 shadow-sm shadow-pink-500/10 scale-105'
                      : 'border-white/10 text-zinc-400 hover:border-pink-500/50 hover:text-pink-500 bg-transparent'
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${liked ? 'fill-white text-white' : ''}`} />
                </button>
              </div>

              {/* Tabs Section */}
              <div className="bg-[#121218] border border-white/5 rounded-xl p-3">
                <div className="flex border-b border-white/5 mb-3">
                  <button
                    onClick={() => setActiveTab('bio')}
                    className={`pb-2 px-3 font-medium text-xs transition-all ${
                      activeTab === 'bio' 
                        ? 'text-white border-b-2 border-purple-500' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`pb-2 px-3 font-medium text-xs transition-all ${
                      activeTab === 'features' 
                        ? 'text-white border-b-2 border-purple-500' 
                        : 'text-zinc-500 hover:text-zinc-300'
                    }`}
                  >
                    Features
                  </button>
                  {routePrefix !== 'character' && (
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`pb-2 px-3 font-medium text-xs transition-all ${
                        activeTab === 'pricing' 
                          ? 'text-white border-b-2 border-purple-500' 
                          : 'text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Pricing
                    </button>
                  )}
                </div>

                <div className="text-zinc-400 text-xs leading-relaxed min-h-[48px]">
                  {activeTab === 'bio' && (
                    <p>{profile.bio || `${profile.name} is ready to converse and form a deep bond with you.`}</p>
                  )}
                  {activeTab === 'features' && (
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                      <li className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-purple-500 text-[10px]">✓</span>
                        <span>{profile.personalityType || 'Engaging Personality'}</span>
                      </li>
                      <li className="flex items-center gap-1.5 text-zinc-400">
                        <span className="text-purple-500 text-[10px]">✓</span>
                        <span>Real-time Audio Chats</span>
                      </li>
                      {profile.interests?.map((interest: string, index: number) => (
                        <li key={index} className="flex items-center gap-1.5 text-zinc-400">
                          <span className="text-purple-500 text-[10px]">✓</span>
                          <span className="capitalize">{interest}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeTab === 'pricing' && (
                    <div className="flex items-center justify-between py-1.5 bg-white/5 rounded-lg px-3">
                      <div>
                        <div className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">Premium Plan</div>
                        <div className="text-sm font-bold text-white font-outfit mt-0.5">
                          ${(profile.monthlyPrice ?? 3.99).toFixed(2)}<span className="text-zinc-500 font-normal text-[10px]">/mo</span>
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsPricingModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-[10px] font-semibold py-1.5 px-3 rounded-lg transition-all"
                      >
                        Subscribe
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gifts Section */}
              {gifts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-300">Gifts Received</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {gifts.map((gift, index) => {
                      const giftRef = GIFTS.find(g => g.name === gift.giftName);
                      if (!giftRef) return null;
                      return (
                        <div key={index} className="relative flex flex-col items-center min-w-[72px] p-2 rounded-xl bg-white/5 border border-white/5 shrink-0 select-none">
                          <div className="absolute top-1 right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[7px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                            <PiCoinsFill className="w-2 h-2" />
                            {giftRef.price}
                          </div>
                          <img src={giftRef.image} alt={gift.giftName} className="w-8 h-8 object-contain mb-1.5" />
                          <img src={gift.sender.avatar} alt={gift.sender.name} className="w-4 h-4 rounded-full object-cover border border-purple-500" />
                          <span className="text-[8px] text-zinc-400 truncate max-w-[60px] mt-0.5">{gift.sender.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Featured Scenes & Reels */}
              {(characterScenes.length > 0 || loadingScenes) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                    <Film className="w-3.5 h-3.5 text-purple-500" />
                    Featured Moments
                  </h3>
                  {loadingScenes ? (
                    <div className="grid grid-cols-3 gap-1.5">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[3/4] bg-white/5 rounded-lg animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {characterScenes.map((scene) => (
                        <div
                          key={scene._id}
                          className="group/scene relative aspect-[3/4] rounded-lg overflow-hidden bg-white/5 border border-white/5 cursor-pointer shadow-sm"
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
                            <img src={scene.mediaUrl} alt={scene.sceneTitle} className="w-full h-full object-cover group-hover/scene:scale-105 transition-transform duration-500" />
                          ) : (
                            <video src={scene.mediaUrl} className="w-full h-full object-cover" preload="metadata" muted playsInline />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-1.5 pointer-events-none">
                            <span className="text-white text-[9px] font-bold truncate">{scene.sceneTitle}</span>
                            {scene.reelId && (
                              <div className="flex items-center gap-1 text-[7px] text-white/70 mt-0.5">
                                <Play className="w-1.5 h-1.5 fill-white/70" />
                                <span>{formatCount(scene.reelViewsCount || 0)}</span>
                              </div>
                            )}
                          </div>
                          {scene.mediaType === "video" && (
                            <div className="absolute top-1.5 right-1.5 p-0.5 bg-black/40 backdrop-blur-md rounded">
                              <Film className="w-2.5 h-2.5 text-white" />
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Similar Profiles Grid */}
              {similarProfiles.length > 0 && (
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <h3 className="text-xs font-semibold text-zinc-300">Similar Companions</h3>
                  <div className="grid grid-cols-3 gap-2">
                    {similarProfiles.map((other) => {
                      const seed = other.name.length + (other.name.charCodeAt(0) || 0);
                      const fallbackAge = (seed % 15) + 18;
                      const displayAge = other.age ?? fallbackAge;
                      
                      return (
                        <div
                          key={other.profileId}
                          onClick={() => openProfile(other.routePrefix, other.legacyId!)}
                          className="group/card relative rounded-lg overflow-hidden cursor-pointer bg-[#14141c] border border-white/5 hover:border-purple-500/40 hover:shadow-md hover:shadow-purple-500/5 transition-all"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img
                              src={other.avatar}
                              alt={other.name}
                              className="w-full h-full object-cover group-hover/card:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-semibold text-white truncate font-outfit">
                                {other.name}, <span className="text-zinc-400 font-normal">{displayAge}</span>
                              </div>
                              <div className="text-[8px] text-zinc-500 truncate mt-0.5">
                                {other.personalityType || other.cardTitle}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {profile && (
        <PricingModal
          isOpen={isPricingModalOpen}
          onClose={() => setIsPricingModalOpen(false)}
          profileImage={activePhoto}
          aiProfileId={profile.profileId}
          aiProfileName={profile.name}
          pricing={(profile as any).pricing}
        />
      )}
    </div>
  );
}
