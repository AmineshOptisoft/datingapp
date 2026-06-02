'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
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

  // Sync engagement counts
  useEffect(() => {
    if (profile) {
      setLikes(profile.likes ?? 0);
      setInteractions(profile.interactions ?? 0);
      
      const dbCharacterId = profile.profileId?.startsWith('character-') 
        ? profile.profileId.replace('character-', '') 
        : (profile as any)._id || (profile as any).id;

      if (typeof window !== 'undefined') {
        const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
        if (dbCharacterId && likedList.includes(dbCharacterId)) {
          setLiked(true);
          return;
        }
      }

      if (user && Array.isArray(profile.likedBy)) {
        const isLiked = profile.likedBy.includes(user.id);
        setLiked(isLiked);
        if (isLiked && dbCharacterId && typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (!likedList.includes(dbCharacterId)) {
            likedList.push(dbCharacterId);
            localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
          }
        }
      } else {
        setLiked(false);
      }
    }
  }, [profile, user]);

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
    setLikes(prev => prev + (newLiked ? 1 : -1));
    setLikeLoading(true);

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
      } else {
        setLiked(prevLiked);
        setLikes(prevLikes);
      }
    } catch (err) {
      console.error('Like failed:', err);
      setLiked(prevLiked);
      setLikes(prevLikes);
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

    closeProfile();
    router.push(`/messages?ai=${profile.profileId}`);
  }, [profile, user, router, closeProfile]);

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
      className="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4 md:p-6 transition-all duration-300 animate-fade-in"
      onClick={closeProfile}
    >
      <div 
        className="relative max-w-6xl w-full h-[90vh] md:h-[85vh] bg-[#0d0d12] border border-white/10 rounded-3xl overflow-hidden grid grid-cols-1 lg:grid-cols-[45%_55%] shadow-2xl animate-scale-up"
        onClick={e => e.stopPropagation()}
      >
        {/* Close Button */}
        <button 
          onClick={closeProfile}
          className="absolute top-4 right-4 z-50 bg-black/50 hover:bg-black/80 text-white rounded-full p-2.5 border border-white/10 hover:border-white/20 hover:scale-105 transition-all shadow-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Image Slider */}
        <div className="relative w-full h-full min-h-[350px] lg:min-h-0 bg-black/60 flex items-center justify-center overflow-hidden group select-none">
          {loading ? (
            <div className="absolute inset-0 bg-zinc-900 animate-pulse flex items-center justify-center">
              <span className="text-zinc-500 text-sm">Loading Photos...</span>
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
                    className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 hover:scale-110 text-white p-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={handleNextPhoto}
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/70 hover:scale-110 text-white p-2 rounded-full border border-white/5 opacity-0 group-hover:opacity-100 transition-all duration-300"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </>
              )}

              {/* Dot Indicators */}
              {photos.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-1.5 z-10 bg-black/40 px-3.5 py-2 rounded-full backdrop-blur-md border border-white/5">
                  {photos.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setActivePhotoIndex(idx)}
                      className={`w-2 h-2 rounded-full transition-all ${
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
        <div className="h-full overflow-y-auto px-6 py-6 md:px-8 md:py-8 space-y-6 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-10 bg-zinc-800 rounded-lg w-2/3"></div>
              <div className="h-6 bg-zinc-800 rounded-lg w-1/3"></div>
              <div className="h-20 bg-zinc-800 rounded-xl"></div>
              <div className="h-12 bg-zinc-800 rounded-xl w-1/2"></div>
            </div>
          ) : error || !profile ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-xl font-semibold text-white">Profile Not Found</h3>
                <p className="text-zinc-500 text-sm mt-1">We couldn't retrieve this profile details.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Profile Header */}
              <div>
                <div className="flex items-center gap-3 mb-1">
                  <h1 className="text-3xl md:text-4xl font-bold text-white tracking-tight font-outfit">
                    {profile.name}
                  </h1>
                  {profile.age && (
                    <span className="text-2xl md:text-3xl font-medium text-zinc-400 font-outfit">
                      , {profile.age}
                    </span>
                  )}
                </div>
                
                <p className="text-lg text-purple-400 font-medium">{profile.personalityType || profile.cardTitle}</p>
                
                <div className="flex items-center gap-2 mt-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                  <span className="text-emerald-500 text-xs font-semibold uppercase tracking-wider">Online</span>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="flex gap-6 border-y border-white/5 py-4">
                <div>
                  <div className="text-2xl font-bold text-white font-outfit">{formatCount(interactions)}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Interactions</div>
                </div>
                <div className="w-px bg-white/5 my-1" />
                <div>
                  <div className="text-2xl font-bold text-white font-outfit">{formatCount(likes)}</div>
                  <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider mt-0.5">Likes</div>
                </div>
              </div>

              {/* Call-to-actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleStartChat}
                  disabled={connectLoading}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-3.5 px-6 rounded-2xl shadow-lg hover:shadow-indigo-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-sm md:text-base disabled:opacity-75 disabled:cursor-not-allowed"
                >
                  {connectLoading ? (
                    <>
                      <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Connecting...
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-5 h-5 fill-white/10" />
                      Connect Now
                    </>
                  )}
                </button>

                <button
                  onClick={handleLike}
                  disabled={likeLoading}
                  className={`px-5 py-3.5 rounded-2xl border-2 font-bold flex items-center justify-center transition-all ${
                    liked
                      ? 'bg-pink-500 border-pink-500 text-white hover:bg-pink-600 hover:border-pink-600 shadow-md shadow-pink-500/10 scale-105'
                      : 'border-white/10 text-zinc-400 hover:border-pink-500/50 hover:text-pink-500 bg-transparent'
                  }`}
                >
                  <Heart className={`w-5 h-5 ${liked ? 'fill-white text-white' : ''}`} />
                </button>
              </div>

              {/* Tabs Section */}
              <div className="bg-[#121218] border border-white/5 rounded-2xl p-4">
                <div className="flex border-b border-white/5 mb-4">
                  <button
                    onClick={() => setActiveTab('bio')}
                    className={`pb-2.5 px-4 font-semibold text-sm transition-all ${
                      activeTab === 'bio' 
                        ? 'text-white border-b-2 border-purple-500' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    About
                  </button>
                  <button
                    onClick={() => setActiveTab('features')}
                    className={`pb-2.5 px-4 font-semibold text-sm transition-all ${
                      activeTab === 'features' 
                        ? 'text-white border-b-2 border-purple-500' 
                        : 'text-zinc-500 hover:text-white'
                    }`}
                  >
                    Features
                  </button>
                  {routePrefix !== 'character' && (
                    <button
                      onClick={() => setActiveTab('pricing')}
                      className={`pb-2.5 px-4 font-semibold text-sm transition-all ${
                        activeTab === 'pricing' 
                          ? 'text-white border-b-2 border-purple-500' 
                          : 'text-zinc-500 hover:text-white'
                      }`}
                    >
                      Pricing
                    </button>
                  )}
                </div>

                <div className="text-zinc-300 text-sm leading-relaxed min-h-[60px]">
                  {activeTab === 'bio' && (
                    <p>{profile.bio || `${profile.name} is ready to converse and form a deep bond with you.`}</p>
                  )}
                  {activeTab === 'features' && (
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      <li className="flex items-center gap-2 text-zinc-300">
                        <span className="text-purple-500 text-xs">✓</span>
                        <span>{profile.personalityType || 'Engaging Personality'}</span>
                      </li>
                      <li className="flex items-center gap-2 text-zinc-300">
                        <span className="text-purple-500 text-xs">✓</span>
                        <span>Real-time Audio Chats</span>
                      </li>
                      {profile.interests?.map((interest: string, index: number) => (
                        <li key={index} className="flex items-center gap-2 text-zinc-300">
                          <span className="text-purple-500 text-xs">✓</span>
                          <span className="capitalize">{interest}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  {activeTab === 'pricing' && (
                    <div className="flex items-center justify-between py-1 bg-white/5 rounded-xl px-4">
                      <div>
                        <div className="text-xs text-zinc-500 uppercase font-bold">Premium Plan</div>
                        <div className="text-lg font-bold text-white font-outfit">
                          ${(profile.monthlyPrice ?? 3.99).toFixed(2)}/mo
                        </div>
                      </div>
                      <button 
                        onClick={() => setIsPricingModalOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 px-4 rounded-xl transition-all"
                      >
                        Subscribe
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Gifts Section */}
              {gifts.length > 0 && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white">Gifts Received</h3>
                  <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-zinc-800 scrollbar-track-transparent">
                    {gifts.map((gift, index) => {
                      const giftRef = GIFTS.find(g => g.name === gift.giftName);
                      if (!giftRef) return null;
                      return (
                        <div key={index} className="relative flex flex-col items-center min-w-[90px] p-2.5 rounded-xl bg-white/5 border border-white/5 shrink-0 select-none">
                          <div className="absolute top-1 right-1 bg-gradient-to-r from-yellow-400 to-amber-500 text-black text-[8px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10">
                            <PiCoinsFill className="w-2.5 h-2.5" />
                            {giftRef.price}
                          </div>
                          <img src={giftRef.image} alt={gift.giftName} className="w-10 h-10 object-contain mb-2" />
                          <img src={gift.sender.avatar} alt={gift.sender.name} className="w-5 h-5 rounded-full object-cover border border-purple-500" />
                          <span className="text-[9px] text-zinc-400 truncate max-w-[70px] mt-1">{gift.sender.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Featured Scenes & Reels */}
              {(characterScenes.length > 0 || loadingScenes) && (
                <div className="space-y-3">
                  <h3 className="text-base font-bold text-white flex items-center gap-1.5">
                    <Film className="w-4 h-4 text-purple-500" />
                    Featured Moments
                  </h3>
                  {loadingScenes ? (
                    <div className="grid grid-cols-3 gap-2">
                      {[1, 2, 3].map(i => (
                        <div key={i} className="aspect-[3/4] bg-white/5 rounded-xl animate-pulse" />
                      ))}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {characterScenes.map((scene) => (
                        <div
                          key={scene._id}
                          className="group/scene relative aspect-[3/4] rounded-xl overflow-hidden bg-white/5 border border-white/5 cursor-pointer shadow-md"
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
                          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-transparent to-transparent flex flex-col justify-end p-2 pointer-events-none">
                            <span className="text-white text-[10px] font-bold truncate">{scene.sceneTitle}</span>
                            {scene.reelId && (
                              <div className="flex items-center gap-1.5 text-[8px] text-white/70 mt-0.5">
                                <Play className="w-2 h-2 fill-white/70" />
                                <span>{formatCount(scene.reelViewsCount || 0)}</span>
                              </div>
                            )}
                          </div>
                          {scene.mediaType === "video" && (
                            <div className="absolute top-2 right-2 p-1 bg-black/40 backdrop-blur-md rounded-md">
                              <Film className="w-3 h-3 text-white" />
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
                <div className="space-y-3 border-t border-white/5 pt-5">
                  <h3 className="text-base font-bold text-white">Similar Companions</h3>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {similarProfiles.map((other) => {
                      const seed = other.name.length + (other.name.charCodeAt(0) || 0);
                      const fallbackAge = (seed % 15) + 18;
                      const displayAge = other.age ?? fallbackAge;
                      
                      return (
                        <div
                          key={other.profileId}
                          onClick={() => openProfile(other.routePrefix, other.legacyId!)}
                          className="group/card relative rounded-xl overflow-hidden cursor-pointer bg-[#14141c] border border-white/5 hover:border-purple-500/50 hover:shadow-lg hover:shadow-purple-500/5 transition-all"
                        >
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img
                              src={other.avatar}
                              alt={other.name}
                              className="w-full h-full object-cover group-hover/card:scale-105 transition-all duration-500"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />
                            <div className="absolute bottom-2 left-2 right-2">
                              <div className="text-xs font-bold text-white truncate font-outfit">
                                {other.name}, <span className="text-zinc-400 font-medium">{displayAge}</span>
                              </div>
                              <div className="text-[9px] text-zinc-400 truncate mt-0.5">
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
            </>
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
