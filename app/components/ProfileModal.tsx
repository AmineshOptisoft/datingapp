'use client';

import { useEffect, useState, useMemo, useCallback } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { X, ChevronLeft, ChevronRight, Film, Play, User, Heart, MessageSquare, Phone, Sparkles, Eye, MapPin, Cake } from 'lucide-react';
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
  const { profile, loading, error } = useProfileDetail(routePrefix || 'girl', legacyId || '');
  const { user } = useAuth();
  const { profiles: allProfiles } = useProfiles(profile?.audienceSegment || null);

  const [activeTab, setActiveTab] = useState<'bio' | 'features' | 'pricing'>('bio');
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [gifts, setGifts] = useState<any[]>([]);
  const [characterScenes, setCharacterScenes] = useState<any[]>([]);
  const [loadingScenes, setLoadingScenes] = useState(false);
  const [likes, setLikes] = useState(0);
  const [interactions, setInteractions] = useState(0);
  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [connectLoading, setConnectLoading] = useState(false);

  useEffect(() => { setActivePhotoIndex(0); setActiveTab('bio'); setConnectLoading(false); }, [legacyId, routePrefix]);

  useEffect(() => {
    if (connectLoading && pathname?.startsWith('/messages')) { setConnectLoading(false); closeProfile(); }
  }, [pathname, connectLoading, closeProfile]);

  useEffect(() => {
    if (profile) {
      setInteractions(profile.interactions ?? 0);
      const dbCharacterId = profile.profileId?.startsWith('character-')
        ? profile.profileId.replace('character-', '')
        : (profile as any)._id || (profile as any).id;
      let isLiked = false;
      if (typeof window !== 'undefined') {
        const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
        if (dbCharacterId && likedList.includes(dbCharacterId)) isLiked = true;
      }
      if (!isLiked && user && Array.isArray(profile.likedBy)) {
        isLiked = profile.likedBy.includes(user.id);
        if (isLiked && dbCharacterId && typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (!likedList.includes(dbCharacterId)) { likedList.push(dbCharacterId); localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList)); }
        }
      }
      setLiked(isLiked);
      const serverLikes = profile.likes ?? 0;
      setLikes(isLiked && serverLikes === 0 ? 1 : serverLikes);
    }
  }, [profile, user]);

  useEffect(() => {
    if (!profile) return;
    const dbCharacterId = profile.profileId?.startsWith('character-') ? profile.profileId.replace('character-', '') : (profile as any)._id || (profile as any).id;
    const handleLikeUpdate = (e: Event) => {
      const { characterId: updatedId, liked: newLiked, likes: newLikes } = (e as CustomEvent).detail;
      if (updatedId === dbCharacterId) { setLiked(newLiked); if (newLikes !== undefined) setLikes(newLikes); }
    };
    window.addEventListener('lily:like-updated', handleLikeUpdate);
    return () => window.removeEventListener('lily:like-updated', handleLikeUpdate);
  }, [profile]);

  useEffect(() => {
    if (!legacyId || !isOpen) return;
    const profileId = routePrefix === 'character' ? legacyId : `${routePrefix}-${legacyId}`;
    fetch(`/api/characters/${profileId}/gifts`).then(r => r.json()).then(d => setGifts(d.success && d.gifts ? d.gifts : [])).catch(() => setGifts([]));
    setLoadingScenes(true);
    fetch(`/api/scenes?characterId=${legacyId}`).then(r => r.json()).then(d => setCharacterScenes(d.success && d.scenes ? d.scenes : [])).catch(() => setCharacterScenes([])).finally(() => setLoadingScenes(false));
  }, [legacyId, routePrefix, isOpen]);

  const photos = useMemo(() => {
    if (!profile) return [];
    const gallery = profile.photos || [];
    return gallery.length === 0 && profile.avatar ? [profile.avatar] : gallery;
  }, [profile]);

  const activePhoto = photos[activePhotoIndex] || profile?.avatar || '';
  const handlePrevPhoto = (e: React.MouseEvent) => { e.stopPropagation(); setActivePhotoIndex(prev => (prev > 0 ? prev - 1 : photos.length - 1)); };
  const handleNextPhoto = (e: React.MouseEvent) => { e.stopPropagation(); setActivePhotoIndex(prev => (prev < photos.length - 1 ? prev + 1 : 0)); };

  const handleLike = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user) { closeProfile(); window.dispatchEvent(new CustomEvent('lily:auth', { detail: { mode: 'login' } })); return; }
    const dbCharacterId = profile?.profileId?.startsWith('character-') ? profile.profileId.replace('character-', '') : (profile as any)?._id || (profile as any)?.id;
    if (!dbCharacterId || likeLoading) return;
    
    const prevLiked = liked; const prevLikes = likes; const newLiked = !liked;
    setLiked(newLiked); 
    const newLikesCount = Math.max(0, prevLikes + (newLiked ? 1 : -1)); 
    setLikes(newLikesCount); 
    setLikeLoading(true);

    // Optimistically update local storage so re-renders don't revert the state
    if (typeof window !== 'undefined') {
      const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
      if (newLiked && !likedList.includes(dbCharacterId)) {
        likedList.push(dbCharacterId);
        localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList));
      } else if (!newLiked) {
        localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList.filter((id: string) => id !== dbCharacterId)));
      }
    }

    window.dispatchEvent(new CustomEvent('lily:like-updated', { detail: { characterId: dbCharacterId, liked: newLiked, likes: newLikesCount } }));
    
    try {
      const res = await fetch(`/api/characters/${dbCharacterId}/like`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) });
      const data = await res.json();
      if (data.success) {
        setLiked(data.liked); setLikes(data.likes);
        if (typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (data.liked) { if (!likedList.includes(dbCharacterId)) { likedList.push(dbCharacterId); localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList)); } }
          else { localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList.filter((id: string) => id !== dbCharacterId))); }
        }
        window.dispatchEvent(new CustomEvent('lily:like-updated', { detail: { characterId: dbCharacterId, liked: data.liked, likes: data.likes } }));
      } else { 
        // Revert on failure
        setLiked(prevLiked); setLikes(prevLikes); 
        if (typeof window !== 'undefined') {
          const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
          if (prevLiked && !likedList.includes(dbCharacterId)) { likedList.push(dbCharacterId); localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList)); }
          else if (!prevLiked) { localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList.filter((id: string) => id !== dbCharacterId))); }
        }
        window.dispatchEvent(new CustomEvent('lily:like-updated', { detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes } })); 
      }
    } catch { 
      // Revert on failure
      setLiked(prevLiked); setLikes(prevLikes); 
      if (typeof window !== 'undefined') {
        const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
        if (prevLiked && !likedList.includes(dbCharacterId)) { likedList.push(dbCharacterId); localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList)); }
        else if (!prevLiked) { localStorage.setItem('lily:liked-profiles', JSON.stringify(likedList.filter((id: string) => id !== dbCharacterId))); }
      }
      window.dispatchEvent(new CustomEvent('lily:like-updated', { detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes } })); 
    }
    finally { setLikeLoading(false); }
  }, [user, profile, likeLoading, liked, likes, router, closeProfile]);

  const handleStartChat = useCallback(async () => {
    if (!profile) return;
    if (!user) { closeProfile(); window.dispatchEvent(new CustomEvent('lily:auth', { detail: { mode: 'login' } })); return; }
    setConnectLoading(true);
    try { if (typeof window !== 'undefined') window.localStorage.setItem('selectedAIProfile', JSON.stringify(profile)); } catch {}
    const dbCharacterId = profile.profileId?.startsWith('character-') ? profile.profileId.replace('character-', '') : (profile as any)._id || (profile as any).id;
    if (dbCharacterId && user) fetch(`/api/characters/${dbCharacterId}/interact`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id }) }).catch(() => {});
    router.push(`/messages?ai=${profile.profileId}`);
  }, [profile, user, router]);

  const similarProfiles = useMemo(() => {
    if (!profile || !allProfiles) return [];
    return allProfiles.filter(p => !(p.legacyId === profile.legacyId && p.routePrefix === profile.routePrefix) && p.audienceSegment === profile.audienceSegment).slice(0, 6);
  }, [profile, allProfiles]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 profile-modal-overlay bg-black/40 dark:bg-black/75 backdrop-blur-md" onClick={closeProfile}>
      <div className="relative max-w-[1150px] w-full h-[90vh] lg:h-[760px] lg:max-h-[90vh] rounded-[20px] overflow-hidden flex flex-col lg:flex-row profile-modal-card bg-white dark:bg-gradient-to-br dark:from-[#1a1a2e] dark:via-[#16161d] dark:to-[#1a1a2e] border border-zinc-200 dark:border-white/10"
        onClick={e => e.stopPropagation()}>
        <div className="profile-modal-glow hidden dark:block" />

        {/* Top-right buttons */}
        <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
          <button onClick={closeProfile} className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110 bg-zinc-100 hover:bg-zinc-200 dark:bg-white/10 dark:hover:bg-white/20 backdrop-blur-md">
            <X className="w-4 h-4 text-zinc-900 dark:text-white/80" />
          </button>
        </div>

        {/* LEFT: Image Gallery */}
        <div className="relative w-full lg:w-[45%] shrink-0 h-[45vh] lg:h-full overflow-hidden group select-none p-3 lg:p-4">
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-zinc-100 dark:bg-black/20">
            {loading ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-100 dark:bg-[#1a1a24]">
                {/* Sleek Spinner */}
                <div className="relative w-12 h-12">
                  <div className="absolute inset-0 rounded-full border-[3px] border-zinc-200 dark:border-white/5"></div>
                  <div className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-[#a855f7] dark:border-t-pink-500 animate-spin"></div>
                </div>
                <span className="mt-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 animate-pulse tracking-wide uppercase">Loading Profile</span>
              </div>
            ) : (
              <>
                <img src={activePhoto} alt={profile?.name || 'Profile'} className="absolute inset-0 w-full h-full object-cover transition-all duration-700" />
                <div className="absolute inset-0 pointer-events-none rounded-2xl" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.4) 0%, transparent 30%)' }} />

                {photos.length > 1 && (
                  <>
                    <button onClick={handlePrevPhoto} className="absolute left-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                      <ChevronLeft className="w-4 h-4 text-white" />
                    </button>
                    <button onClick={handleNextPhoto} className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }}>
                      <ChevronRight className="w-4 h-4 text-white" />
                    </button>
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
                      {photos.map((_: string, idx: number) => (
                        <button key={idx} onClick={() => setActivePhotoIndex(idx)}
                          className={`rounded-full transition-all duration-300 ${activePhotoIndex === idx ? 'w-6 h-2' : 'w-2 h-2'}`}
                          style={{ background: activePhotoIndex === idx ? 'linear-gradient(90deg, #a855f7, #ec4899)' : 'rgba(255,255,255,0.35)' }} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* RIGHT: Profile Info — scrolls independently */}
        <div className="relative z-10 lg:w-[55%] h-full overflow-y-auto px-5 py-5 space-y-5 scrollbar-hide">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              <div className="h-8 rounded-lg w-2/3 bg-zinc-200 dark:bg-white/5" />
              <div className="h-4 rounded-lg w-1/3 bg-zinc-200 dark:bg-white/5" />
              <div className="h-20 rounded-xl bg-zinc-200 dark:bg-white/5" />
            </div>
          ) : error || !profile ? (
            <div className="flex h-full items-center justify-center">
              <div className="text-center">
                <h3 className="text-base font-semibold text-zinc-900 dark:text-white">Profile Not Found</h3>
                <p className="text-zinc-500 text-xs mt-1">We couldn&apos;t retrieve this profile.</p>
              </div>
            </div>
          ) : (
            <>
              {/* Name & Age */}
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-white tracking-tight font-outfit">{profile.name}</h1>
                <div className="flex items-center gap-3 mt-2 text-zinc-500 dark:text-zinc-400 text-xs">
                  {profile.age && <span className="flex items-center gap-1"><Cake className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />{profile.age} years</span>}
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />{(profile as any).location || 'Online'}</span>
                </div>
              </div>

              {/* Bio */}
              <p className="text-[13px] text-zinc-600 dark:text-zinc-400 leading-relaxed">{profile.bio || `${profile.name} is ready to converse and form a deep bond with you.`}</p>

              {/* Stats Row */}
              <div className="flex items-center gap-4 text-xs text-zinc-500 dark:text-zinc-400">
                <span className="flex items-center gap-1.5"><Heart className={`w-3.5 h-3.5 ${liked ? 'fill-pink-500 text-pink-500' : 'text-pink-400'}`} />{formatCount(likes)}</span>
                <span className="flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />{formatCount(interactions)}</span>
                <button onClick={() => { /* scroll to features */ setActiveTab('features'); }} className="flex items-center gap-1.5 hover:text-zinc-900 dark:hover:text-white transition-colors"><User className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />Profile</button>
              </div>

              {/* Start Here — Action Grid */}
              <div>
                <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 mb-3">Start here</h3>
                <p className="text-[11px] text-zinc-500 mb-3">Jump into a chat, explore content, or connect with {profile.name}.</p>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={handleStartChat} disabled={connectLoading} className="profile-action-btn">
                    {connectLoading ? (
                      <svg className="animate-spin w-5 h-5 text-purple-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                    ) : <MessageSquare />}
                    {connectLoading ? 'Connecting...' : 'New Chat'}
                  </button>
                  <button onClick={handleLike} className="profile-action-btn">
                    <Heart className={liked ? 'fill-pink-500 text-pink-500' : ''} />
                    {liked ? 'Liked' : 'Like'}
                  </button>
                  <button onClick={() => router.push(`/voice?ai=${profile.profileId}`)} className="profile-action-btn">
                    <Phone />Call
                  </button>
                  {routePrefix !== 'character' ? (
                    <button onClick={() => setIsPricingModalOpen(true)} className="profile-action-btn">
                      <Sparkles />Subscribe
                    </button>
                  ) : (
                    <button onClick={handleStartChat} className="profile-action-btn">
                      <Sparkles />Generate
                    </button>
                  )}
                </div>
              </div>

              {/* About / Features Tabs */}
              <div className="rounded-xl p-3 bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                <div className="flex gap-1 mb-3 border-b border-zinc-200 dark:border-white/10">
                  {(['bio', 'features'] as const).map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)}
                      className={`pb-2 px-3 text-xs font-medium transition-all ${activeTab === tab ? 'text-zinc-900 dark:text-white' : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'}`}
                      style={activeTab === tab ? { borderBottom: '2px solid #a855f7' } : {}}>
                      {tab === 'bio' ? 'About' : 'Features'}
                    </button>
                  ))}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed min-h-[40px]">
                  {activeTab === 'bio' && <p>{profile.bio || `${profile.name} is ready to converse and form a deep bond with you.`}</p>}
                  {activeTab === 'features' && (
                    <ul className="grid grid-cols-2 gap-1.5">
                      <li className="flex items-center gap-1.5"><span className="text-purple-500 dark:text-purple-400 text-[10px]">✓</span>{profile.personalityType || 'Engaging Personality'}</li>
                      <li className="flex items-center gap-1.5"><span className="text-purple-500 dark:text-purple-400 text-[10px]">✓</span>Real-time Audio Chats</li>
                      {profile.interests?.map((interest: string, i: number) => (
                        <li key={i} className="flex items-center gap-1.5"><span className="text-purple-500 dark:text-purple-400 text-[10px]">✓</span><span className="capitalize">{interest}</span></li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>

              {/* Gifts */}
              {gifts.length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">Gifts Received</h3>
                  <div className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-hide">
                    {gifts.map((gift, index) => {
                      const giftRef = GIFTS.find(g => g.name === gift.giftName);
                      if (!giftRef) return null;
                      return (
                        <div key={index} className="relative flex flex-col items-center min-w-[72px] p-2 rounded-xl shrink-0 select-none bg-zinc-50 dark:bg-white/5 border border-zinc-200 dark:border-white/10">
                          <div className="absolute top-1 right-1 text-[7px] font-bold px-1 py-0.5 rounded-full flex items-center gap-0.5 z-10" style={{ background: 'linear-gradient(90deg, #facc15, #f59e0b)', color: '#000' }}>
                            <PiCoinsFill className="w-2 h-2" />{giftRef.price}
                          </div>
                          <img src={giftRef.image} alt={gift.giftName} className="w-8 h-8 object-contain mb-1.5" />
                          <img src={gift.sender.avatar} alt={gift.sender.name} className="w-4 h-4 rounded-full object-cover border border-purple-500" />
                          <span className="text-[8px] text-zinc-500 truncate max-w-[60px] mt-0.5">{gift.sender.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Featured Scenes */}
              {(characterScenes.length > 0 || loadingScenes) && (
                <div className="space-y-2">
                  <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-300 flex items-center gap-1.5"><Film className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />Featured Moments</h3>
                  {loadingScenes ? (
                    <div className="grid grid-cols-3 gap-1.5">{[1,2,3].map(i => <div key={i} className="aspect-[3/4] rounded-lg animate-pulse bg-zinc-200 dark:bg-white/5" />)}</div>
                  ) : (
                    <div className="grid grid-cols-3 gap-1.5">
                      {characterScenes.map(scene => (
                        <div key={scene._id} className="group/scene relative aspect-[3/4] rounded-lg overflow-hidden cursor-pointer border border-zinc-200 dark:border-white/10"
                          onMouseEnter={e => { const v = e.currentTarget.querySelector('video'); if (v) (v as HTMLVideoElement).play().catch(() => {}); }}
                          onMouseLeave={e => { const v = e.currentTarget.querySelector('video'); if (v) { (v as HTMLVideoElement).pause(); (v as HTMLVideoElement).currentTime = 0; } }}>
                          {scene.mediaType === 'image' ? <img src={scene.mediaUrl} alt={scene.sceneTitle} className="w-full h-full object-cover group-hover/scene:scale-105 transition-transform duration-500" /> : <video src={scene.mediaUrl} className="w-full h-full object-cover" preload="metadata" muted playsInline />}
                          <div className="absolute inset-0 flex flex-col justify-end p-1.5 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.85) 0%, transparent 50%)' }}>
                            <span className="text-white text-[9px] font-bold truncate">{scene.sceneTitle}</span>
                            {scene.reelId && <div className="flex items-center gap-1 text-[7px] text-white/70 mt-0.5"><Play className="w-1.5 h-1.5 fill-white/70" />{formatCount(scene.reelViewsCount || 0)}</div>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Similar Characters */}
              {similarProfiles.length > 0 && (
                <div className="space-y-3 pt-3 border-t border-zinc-200 dark:border-white/10">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-purple-500 dark:text-purple-400" />
                    <h3 className="text-xs font-semibold text-zinc-800 dark:text-zinc-300">Similar characters</h3>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    {similarProfiles.map(other => {
                      const seed = other.name.length + (other.name.charCodeAt(0) || 0);
                      const displayAge = other.age ?? (seed % 15) + 18;
                      return (
                        <div key={other.profileId} onClick={() => openProfile(other.routePrefix, other.legacyId!)}
                          className="group/card relative rounded-xl overflow-hidden cursor-pointer transition-all hover:scale-[1.03] border border-zinc-200 dark:border-white/10">
                          <div className="relative aspect-[3/4] overflow-hidden">
                            <img src={other.avatar} alt={other.name} className="w-full h-full object-cover group-hover/card:scale-110 transition-all duration-500" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.9) 0%, transparent 50%)' }} />
                            <div className="absolute bottom-1.5 left-1.5 right-1.5">
                              <div className="text-[10px] font-semibold text-white truncate font-outfit">{other.name}, <span className="text-zinc-400 font-normal">{displayAge}</span></div>
                              <div className="text-[8px] text-zinc-400 truncate mt-0.5">{other.personalityType || other.cardTitle}</div>
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
        <PricingModal isOpen={isPricingModalOpen} onClose={() => setIsPricingModalOpen(false)} profileImage={activePhoto}
          aiProfileId={profile.profileId} aiProfileName={profile.name} pricing={(profile as any).pricing} />
      )}
    </div>
  );
}
