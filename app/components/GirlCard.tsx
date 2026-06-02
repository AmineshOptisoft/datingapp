'use client';

import { useRouter } from 'next/navigation';
import { RoutePrefix } from '@/types/ai-profile';
import { getProfileRoute } from '@/lib/url-helpers';
import { setProfilePreview } from '@/lib/profile-preview-cache';
import { useProfileModal } from '@/app/contexts/ProfileModalContext';

interface GirlCardProps {
  _id?: string;
  legacyId: number | string | null;
  routePrefix: RoutePrefix;
  name: string;
  cardTitle: string;
  monthlyPrice: number;
  avatar: string;
  badgeHot?: boolean;
  badgePro?: boolean;
  personality?: string;
  likes?: number;
  interactions?: number;
  age?: number;
  audienceSegment?: string;
}

// Helper to format numbers (e.g., 1500 -> 1.5K)
const formatStat = (num: number) => {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
  return num.toString();
};

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/app/contexts/AuthContext';

export default function GirlCard({
  _id,
  legacyId,
  routePrefix,
  name,
  cardTitle,
  monthlyPrice,
  avatar,
  badgeHot = false,
  badgePro = false,
  personality,
  likes,
  interactions,
  age,
  audienceSegment,
}: GirlCardProps) {
  const router = useRouter();
  const { openProfile } = useProfileModal();
  const { user } = useAuth();
  
  const displayText = routePrefix === 'character' && personality ? personality : cardTitle;
  const slugSource = routePrefix === 'character' && personality ? personality : cardTitle;

  // Generate a stable username from name
  const username = name.toLowerCase().replace(/\s+/g, '_').slice(0, 12);

  // Generate stable-ish stats from name length as fallback if API doesn't provide them
  const seed = name.length + (name.charCodeAt(0) || 0);
  const fallbackLikes = (seed * 37 + 50) % 900 + 20;
  const fallbackInteractions = ((seed * 73 + 100) % 4500 + 50) * 100;
  const fallbackAge = (seed % 15) + 18; // Age between 18 and 32

  const finalLikes = likes !== undefined ? likes : fallbackLikes;
  const finalInteractions = interactions !== undefined ? interactions : fallbackInteractions;
  const finalAge = age !== undefined && age !== null ? age : fallbackAge;

  // Pick a color for the avatar circle based on name
  const avatarColors = ['bg-blue-500', 'bg-emerald-500', 'bg-purple-500', 'bg-orange-500', 'bg-pink-500', 'bg-cyan-500', 'bg-rose-500', 'bg-amber-500'];
  const avatarColor = avatarColors[seed % avatarColors.length];

  const profileRoute = getProfileRoute(routePrefix, name, slugSource, legacyId);
  const cacheKey = `${routePrefix}-${legacyId}`;

  // Unique database identifier for likes API
  const dbCharacterId = routePrefix === 'character' ? legacyId : _id;

  const [liked, setLiked] = useState(false);
  const [likeLoading, setLikeLoading] = useState(false);
  const [likesCount, setLikesCount] = useState(finalLikes);

  // Sync likes count prop changes
  useEffect(() => {
    setLikesCount(finalLikes);
  }, [finalLikes]);

  // Check localStorage on mount / dbCharacterId change
  useEffect(() => {
    if (dbCharacterId && typeof window !== 'undefined') {
      const likedList = JSON.parse(localStorage.getItem('lily:liked-profiles') || '[]');
      setLiked(likedList.includes(dbCharacterId));
    }
  }, [dbCharacterId]);

  // Listen to global like updates
  useEffect(() => {
    const handleLikeUpdate = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { characterId: updatedId, liked: newLiked, likes: newLikes } = customEvent.detail;
      if (updatedId === dbCharacterId) {
        setLiked(newLiked);
        if (newLikes !== undefined) {
          setLikesCount(newLikes);
        }
      }
    };
    window.addEventListener('lily:like-updated', handleLikeUpdate);
    return () => window.removeEventListener('lily:like-updated', handleLikeUpdate);
  }, [dbCharacterId]);

  const handleLikeClick = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/login');
      return;
    }

    if (!dbCharacterId || likeLoading) return;

    // Optimistic toggle
    const prevLiked = liked;
    const prevLikes = likesCount;
    const newLiked = !liked;

    setLiked(newLiked);
    const newLikesCount = prevLikes + (newLiked ? 1 : -1);
    setLikesCount(newLikesCount);
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
        setLikesCount(data.likes);
        
        // Update localStorage
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
        // Rollback
        setLiked(prevLiked);
        setLikesCount(prevLikes);
        window.dispatchEvent(new CustomEvent('lily:like-updated', {
          detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes }
        }));
      }
    } catch (err) {
      console.error('Like failed:', err);
      // Rollback
      setLiked(prevLiked);
      setLikesCount(prevLikes);
      window.dispatchEvent(new CustomEvent('lily:like-updated', {
        detail: { characterId: dbCharacterId, liked: prevLiked, likes: prevLikes }
      }));
    } finally {
      setLikeLoading(false);
    }
  }, [user, dbCharacterId, likeLoading, liked, likesCount, router]);

  function handleCardClick() {
    // Write card data into preview cache BEFORE navigating so the profile
    // page can render instantly without waiting for the full API response.
    setProfilePreview(cacheKey, {
      _id,
      name,
      avatar,
      cardTitle,
      personalityType: personality,
      age: finalAge,
      likes: likesCount,
      interactions: finalInteractions,
      routePrefix,
      monthlyPrice,
      audienceSegment,
    });
    if (legacyId) {
      openProfile(routePrefix, legacyId);
    } else {
      router.push(profileRoute);
    }
  }

  return (
    <div
      onClick={handleCardClick}
      className="group relative rounded-xl overflow-hidden cursor-pointer block bg-[#1a1a1f]"
    >
      {/* Card Image */}
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={avatar}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />

        {/* ── Top bar ── */}
        {/* Username badge top-left */}
        <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 bg-black/40 backdrop-blur-md rounded-full pl-1 pr-2.5 py-1">
          <div className={`w-5 h-5 rounded-full ${avatarColor} flex items-center justify-center`}>
            <span className="text-white text-[9px] font-bold uppercase">{name.charAt(0)}</span>
          </div>
          <span className="text-white/90 text-[11px] font-medium truncate max-w-[70px]">@{username}</span>
        </div>

        {/* Heart icon top-right */}
        <button
          onClick={handleLikeClick}
          disabled={likeLoading}
          className={`absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full backdrop-blur-md transition-all ${
            liked
              ? 'bg-pink-500 text-white hover:bg-pink-600 scale-105 shadow-lg shadow-pink-500/15'
              : 'bg-black/40 text-white hover:bg-black/60 hover:scale-105'
          } ${likeLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
        >
          <svg
            className={`w-[16px] h-[16px] transition-transform ${liked ? 'fill-white' : ''}`}
            fill={liked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>

        {/* ── Bottom gradient (Subtle shadow for text readability) ── */}
        <div className="absolute inset-0 top-1/2 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

        {/* ── Bottom content ── */}
        <div className="absolute bottom-0 left-0 right-0 px-3.5 pb-3 pt-12">
          {/* Name + Online pill */}
          <div className="flex items-center gap-1.5 mb-1.5">
            <h3 className="text-white font-medium text-[22px] leading-tight tracking-normal" style={{ fontFamily: "'Outfit', system-ui, sans-serif" }}>
              {name}
            </h3>
            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] border border-emerald-500/30 bg-emerald-500/20 rounded-full shrink-0 transform translate-y-[2px]">
              <span className="w-[4px] h-[4px] rounded-full bg-emerald-400" />
              <span className="text-[9px] font-medium text-emerald-400 capitalize tracking-wide">Online</span>
            </span>
          </div>

          {/* Location / personality */}
          <div className="flex items-center gap-1 mb-2">
            <svg className="w-[11px] h-[11px] text-zinc-300 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="text-zinc-300 text-[12px] truncate font-normal tracking-wide">{displayText}</span>
          </div>

          {/* Stats row (Age on left, Stats on right) */}
          <div className="flex items-center justify-between">
            <span className="text-[12px] text-zinc-300 font-normal tracking-wide">{finalAge} years old</span>
            
            <div className="flex items-center gap-2">
              {/* Hearts */}
              <div className="flex items-center gap-1">
                <svg className="w-[11px] h-[11px] text-zinc-300 fill-zinc-300" viewBox="0 0 24 24">
                  <path d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span className="text-[11px] font-medium text-zinc-200 tracking-wide">{formatStat(likesCount)}</span>
              </div>
              {/* Messages */}
              <div className="flex items-center gap-1">
                <svg className="w-[11px] h-[11px] text-zinc-300" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span className="text-[11px] font-medium text-zinc-200 tracking-wide">{formatStat(finalInteractions)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
