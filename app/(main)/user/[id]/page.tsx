"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Grid, Film, User, MessageSquare, Play, MoreVertical } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import ReportModal from "@/components/ReportModal";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

interface PublicUser {
  _id: string;
  name: string;
  username?: string;
  avatar: string | null;
  bio?: string;
}

interface Character {
  _id: string;
  characterName: string;
  characterImage: string | null;
  characterAge: number;
  characterGender: string;
  language: string;
  tags: string[];
  description: string;
  visibility: string;
}

interface Scene {
  _id: string;
  sceneTitle: string;
  sceneDescription: string;
  mediaUrl: string;
  mediaType: "image" | "video";
  createdAt: string;
  reelId?: string;
  reelViewsCount?: number;
  reelLikesCount?: number;
  userName?: string;
  userAvatar?: string | null;
}

export default function PublicUserProfilePage() {
  const params = useParams();
  const router = useRouter();
  const userId = params.id as string;

  const [profileUser, setProfileUser] = useState<PublicUser | null>(null);
  const [characters, setCharacters] = useState<Character[]>([]);
  const [scenes, setScenes] = useState<Scene[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"characters" | "scenes">("characters");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [totalInteractions, setTotalInteractions] = useState(0);
  const [isTogglingFollow, setIsTogglingFollow] = useState(false);
  const [isTogglingBlock, setIsTogglingBlock] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [selectedCharacterForScenes, setSelectedCharacterForScenes] = useState<Character | null>(null);
  const [characterScenes, setCharacterScenes] = useState<Scene[]>([]);
  const [loadingCharacterScenes, setLoadingCharacterScenes] = useState(false);
  const [isCharacterScenesOpen, setIsCharacterScenesOpen] = useState(false);
  const [viewingScene, setViewingScene] = useState<Scene | null>(null);
  const [isSceneViewOpen, setIsSceneViewOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const formatViews = (count: number) => {
    if (!count) return "0";
    if (count >= 1000000) {
      return (count / 1000000).toFixed(1).replace(/\.0$/, '') + 'M';
    }
    if (count >= 1000) {
      return (count / 1000).toFixed(1).replace(/\.0$/, '') + 'k';
    }
    return count.toString();
  };

  useEffect(() => {
    if (!userId) return;
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      try {
         const parsedUser = JSON.parse(storedUser);
         const cid = parsedUser._id || parsedUser.id || parsedUser.userId;
         if (cid) setCurrentUserId(cid);
      } catch (e) {}
    }
    fetchProfile();
  }, [userId]);

  const fetchProfile = async (showLoading = true) => {
    try {
      if (showLoading) setLoading(true);
      const token = localStorage.getItem("token");
      const res = await fetch(`/api/users/${userId}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "User not found");
        return;
      }

      setProfileUser(data.user);
      setFollowersCount(data.user.followersCount || 0);
      setFollowingCount(data.user.followingCount || 0);
      setTotalInteractions(data.user.totalInteractions || 0);
      setIsFollowing(data.isFollowing || false);
      setIsBlocked(data.isBlocked || false);
      setCharacters(data.characters || []);
      setScenes(data.scenes || []);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const fetchCharacterScenes = async (characterId: string) => {
    try {
      setLoadingCharacterScenes(true);
      const res = await fetch(`/api/scenes?userId=${userId}&characterId=${characterId}`);
      const data = await res.json();
      if (data.success) {
        setCharacterScenes(data.scenes || []);
      }
    } catch (error) {
      console.error("Error fetching character scenes:", error);
    } finally {
      setLoadingCharacterScenes(false);
    }
  };

  const handleCharacterClick = (character: Character) => {
    setSelectedCharacterForScenes(character);
    setIsCharacterScenesOpen(true);
    fetchCharacterScenes(character._id);
  };

  const handleFollowToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast?.error?.("Please login to follow users") || alert("Please login to follow users");
      return;
    }

    setIsTogglingFollow(true);
    const wasFollowing = isFollowing;
    
    // Optimistic UI update
    setIsFollowing(!wasFollowing);
    setFollowersCount((prev) => wasFollowing ? prev - 1 : prev + 1);

    try {
      const res = await fetch(`/api/users/${userId}/follow`, {
        method: wasFollowing ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setIsFollowing(wasFollowing);
        setFollowersCount((prev) => wasFollowing ? prev + 1 : prev - 1);
        toast?.error?.(data.error || "Failed to update follow status") || alert("Failed to update follow status");
      }
    } catch {
      // Revert on error
      setIsFollowing(wasFollowing);
      setFollowersCount((prev) => wasFollowing ? prev + 1 : prev - 1);
      toast?.error?.("Network error") || alert("Network error");
    } finally {
      setIsTogglingFollow(false);
    }
  };

  const handleBlockToggle = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast?.error?.("Please login to block users") || alert("Please login to block users");
      return;
    }

    setIsTogglingBlock(true);
    const wasBlocked = isBlocked;
    const prevCharacters = characters;
    const prevScenes = scenes;
    
    // Optimistic UI update
    setIsBlocked(!wasBlocked);
    if (!wasBlocked) { // If blocking
      if (isFollowing) {
        setIsFollowing(false);
        setFollowersCount((prev) => Math.max(0, prev - 1));
      }
      setCharacters([]);
      setScenes([]);
    }

    try {
      const res = await fetch(`/api/users/${userId}/block`, {
        method: wasBlocked ? "DELETE" : "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (!data.success) {
        // Revert on failure
        setIsBlocked(wasBlocked);
        if (!wasBlocked) {
          setCharacters(prevCharacters);
          setScenes(prevScenes);
        }
        toast?.error?.(data.error || "Failed to update block status") || alert("Failed to update block status");
        fetchProfile(false);
      } else {
        toast?.success?.(wasBlocked ? "User unblocked" : "User blocked") || alert(wasBlocked ? "User unblocked" : "User blocked");
        fetchProfile(false); // Fetch silently without full page loading spinner
      }
    } catch {
      // Revert on error
      setIsBlocked(wasBlocked);
      if (!wasBlocked) {
        setCharacters(prevCharacters);
        setScenes(prevScenes);
      }
      toast?.error?.("Network error") || alert("Network error");
    } finally {
      setIsTogglingBlock(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center pt-20">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-full border-4 border-pink-500 border-t-transparent animate-spin" />
          <p className="text-zinc-500 dark:text-zinc-400 text-sm font-medium">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (error || !profileUser) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex flex-col items-center justify-center gap-4 pt-20">
        <div className="text-5xl">😕</div>
        <h2 className="text-zinc-900 dark:text-white text-xl font-bold">Profile Not Found</h2>
        <p className="text-zinc-500 dark:text-zinc-400 text-sm">{error || "This user doesn't exist."}</p>
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 mt-2 px-5 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 text-white rounded-full font-semibold text-sm hover:opacity-90 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Go Back
        </button>
      </div>
    );
  }

  const handle = profileUser.username || profileUser.name || "User";

  const tabs = [
    { id: "characters" as const, label: "Characters", icon: Grid },
    { id: "scenes" as const, label: "Scenes", icon: Film },
  ];

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white pt-20 pb-10 px-4 flex flex-col items-center transition-colors">
      {/* Back Button */}
      <div className="w-full max-w-2xl mb-4">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition text-sm font-medium group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back
        </button>
      </div>

      {/* Profile Header */}
      <div className="flex flex-col items-center w-full max-w-2xl mx-auto space-y-4">
        {/* Avatar */}
        <div className="w-28 h-28 md:w-32 md:h-32 rounded-full overflow-hidden bg-gradient-to-br from-lime-400 to-yellow-400 p-[3px] shadow-xl shadow-lime-500/20 flex-shrink-0">
          <div className="w-full h-full rounded-full bg-zinc-100 dark:bg-zinc-900 flex items-center justify-center overflow-hidden">
            {profileUser.avatar ? (
              <img
                src={profileUser.avatar}
                alt={profileUser.name}
                className="object-cover w-full h-full"
              />
            ) : (
              <span className="text-5xl font-bold text-zinc-900 dark:text-white uppercase">
                {profileUser.name[0]}
              </span>
            )}
          </div>
        </div>

        {/* Description & Action */}
        <div className="text-center space-y-4">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-white">{profileUser.name}</h1>
            {profileUser.username && (
              <p className="text-zinc-500 dark:text-zinc-400 text-sm">@{profileUser.username}</p>
            )}
            {profileUser.bio && (
              <p className="text-zinc-600 dark:text-zinc-300 text-sm max-w-sm mx-auto mt-1 leading-relaxed">
                {profileUser.bio}
              </p>
            )}
          </div>
          
          {currentUserId !== userId && (
             <div className="flex gap-2 justify-center mt-2">
               <button
                 onClick={handleBlockToggle}
                 disabled={isTogglingBlock}
                 className={cn(
                   "px-6 py-2 rounded-full font-semibold text-sm transition-all shadow-sm",
                   isBlocked
                     ? "bg-red-500 text-white hover:bg-red-600 shadow-md shadow-red-500/20"
                     : "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700"
                 )}
               >
                 {isBlocked ? "Unblock" : "Block"}
               </button>
               {!isBlocked && (
                 <button
                   onClick={handleFollowToggle}
                   disabled={isTogglingFollow}
                   className={cn(
                     "px-6 py-2 rounded-full font-semibold text-sm transition-all",
                     isFollowing
                       ? "bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700"
                       : "bg-gradient-to-r from-pink-500 to-purple-600 text-white hover:opacity-90 shadow-md shadow-pink-500/20"
                   )}
                 >
                   {isFollowing ? "Following" : "Follow"}
                 </button>
               )}
               <Popover>
                 <PopoverTrigger asChild>
                   <button className="px-3 py-2 rounded-full font-semibold text-sm transition-all shadow-sm bg-zinc-100 text-zinc-900 border border-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-white dark:border-zinc-700 dark:hover:bg-zinc-700 focus:outline-none">
                     <MoreVertical className="w-5 h-5 mx-0" />
                   </button>
                 </PopoverTrigger>
                 <PopoverContent className="w-40 p-2" align="end">
                   <button
                     onClick={() => setIsReportModalOpen(true)}
                     className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-md transition-colors font-medium"
                   >
                     Report User
                   </button>
                 </PopoverContent>
               </Popover>
             </div>
           )}
        </div>

        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-zinc-500 font-medium">
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">{followersCount}</span> Followers
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">{followingCount}</span> Following
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>{totalInteractions} Interactions</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="w-full mt-6 border-b border-zinc-200 dark:border-zinc-800">
          <div className="flex items-center justify-center gap-8 pb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "relative pb-3 text-sm font-medium transition-all flex items-center gap-2",
                  activeTab === tab.id
                    ? "text-zinc-900 dark:text-white"
                    : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                )}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 w-full h-0.5 bg-zinc-900 dark:bg-white rounded-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="w-full py-4">
          {/* Characters tab */}
          {activeTab === "characters" && (
            <div>
              {characters.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
                  <User className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No characters yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                  {characters.map((character) => (
                    <div
                      key={character._id}
                      onClick={() => handleCharacterClick(character)}
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group cursor-pointer"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        {character.characterImage ? (
                          <img
                            src={character.characterImage.startsWith('http') ? character.characterImage : character.characterImage}
                            alt={character.characterName}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <User className="w-12 h-12 text-zinc-400" />
                          </div>
                        )}
                        {/* Gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      {/* Info */}
                      <div className="p-4 space-y-2">
                        <h3 className="font-bold text-base text-zinc-900 dark:text-white truncate">
                          {character.characterName}
                        </h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400">
                          Age: {character.characterAge} • {character.language}
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-2 leading-relaxed">
                          {character.description}
                        </p>

                        {/* Tags */}
                        {character.tags && character.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 pt-1">
                            {character.tags.slice(0, 3).map((tag, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-pink-500/10 text-pink-500 text-xs rounded-md font-medium"
                              >
                                {tag}
                              </span>
                            ))}
                            {character.tags.length > 3 && (
                              <span className="px-2 py-0.5 text-zinc-400 text-xs">
                                +{character.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Scenes tab */}
          {activeTab === "scenes" && (
            <div>
              {scenes.length === 0 ? (
                <div className="text-center py-16 text-zinc-400 dark:text-zinc-600">
                  <Film className="w-12 h-12 mx-auto mb-3 opacity-40" />
                  <p className="font-medium">No scenes posted yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {scenes.map((scene) => (
                    <div
                      key={scene._id}
                      className="group relative bg-zinc-50 dark:bg-zinc-800/50 rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600 transition-all"
                    >
                      {/* Media */}
                      <div className="aspect-square w-full bg-zinc-100 dark:bg-zinc-900 relative overflow-hidden">
                        {scene.mediaType === "image" ? (
                          <img
                            src={scene.mediaUrl}
                            alt={scene.sceneTitle}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <video
                            src={scene.mediaUrl}
                            className="w-full h-full object-cover"
                            preload="metadata"
                            muted
                          />
                        )}
                        {/* Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors pointer-events-none" />
                        
                        {/* Reel Views Overlay */}
                        {scene.reelId && (
                          <>
                            <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/60 to-transparent pointer-events-none z-10" />
                            <div className="absolute top-2 left-2 flex items-center gap-1.5 text-white/95 text-[14px] font-bold drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] z-20 pointer-events-none">
                              <Play className="w-5 h-5 fill-transparent stroke-white/95 stroke-[2]" />
                              <span>{formatViews(scene.reelViewsCount || 0)}</span>
                            </div>
                          </>
                        )}
                        
                        {scene.mediaType === "video" && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full z-20">
                            🎬 Video
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="p-3">
                        <h3 className="font-semibold text-zinc-900 dark:text-white truncate text-sm">
                          {scene.sceneTitle}
                        </h3>
                        {scene.sceneDescription && (
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mt-1 leading-relaxed">
                            {scene.sceneDescription}
                          </p>
                        )}
                        <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-2">
                          {new Date(scene.createdAt).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Character Scenes Modal */}
      {isCharacterScenesOpen && selectedCharacterForScenes && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsCharacterScenesOpen(false)}
          />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between bg-zinc-50 dark:bg-zinc-900/50">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  {selectedCharacterForScenes.characterImage ? (
                    <img src={selectedCharacterForScenes.characterImage} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                       <User className="w-5 h-5 text-zinc-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-zinc-900 dark:text-white">{selectedCharacterForScenes.characterName}'s Scenes</h3>
                  <p className="text-xs text-zinc-500">Discover all imaginary moments</p>
                </div>
              </div>
              <button 
                onClick={() => setIsCharacterScenesOpen(false)}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Scenes Content */}
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              {loadingCharacterScenes ? (
                <div className="flex flex-col items-center justify-center py-20 gap-3">
                  <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
                  <p className="text-zinc-500 text-sm font-medium">Loading scenes...</p>
                </div>
              ) : characterScenes.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {characterScenes.map((scene) => (
                    <div
                      key={scene._id}
                      className="group relative aspect-square rounded-xl overflow-hidden border border-zinc-200 dark:border-zinc-800 bg-zinc-100 dark:bg-zinc-950 cursor-pointer"
                      onClick={() => {
                        setViewingScene(scene);
                        setIsSceneViewOpen(true);
                      }}
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
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
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
                      
                      {/* Overlay Info */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-100 pointer-events-none transition-opacity flex flex-col justify-end p-3">
                        <p className="text-white text-xs font-bold truncate">{scene.sceneTitle}</p>
                        {scene.reelId ? (
                           <div className="flex flex-col gap-0.5 text-white/80 text-[10px] mt-0.5">
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Play className="w-3 h-3 fill-white/80" />
                                  <span>{formatViews(scene.reelViewsCount || 0)}</span>
                                </div>
                                <div className="flex items-center gap-1">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-3 h-3 text-pink-500">
                                    <path d="m11.645 20.91-.007-.003-.022-.012a15.247 15.247 0 0 1-.383-.218 25.18 25.18 0 0 1-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0 1 12 5.052 5.5 5.5 0 0 1 16.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 0 1-4.244 3.17 15.247 15.247 0 0 1-.383.219l-.022.012-.007.004-.003.001Z" />
                                  </svg>
                                  <span>{formatViews(scene.reelLikesCount || 0)}</span>
                                </div>
                              </div>
                              <div className="flex items-center gap-1.5 text-white/60 italic">
                                {scene.userAvatar ? (
                                  <img src={scene.userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                                ) : (
                                  <User className="w-3.5 h-3.5" />
                                )}
                                <span>By {scene.userName || 'Unknown'}</span>
                              </div>
                           </div>
                         ) : (
                           <div className="flex items-center gap-1.5 text-white/60 text-[9px] mt-0.5 italic">
                             {scene.userAvatar ? (
                               <img src={scene.userAvatar} alt="" className="w-3.5 h-3.5 rounded-full object-cover" />
                             ) : (
                               <User className="w-3.5 h-3.5" />
                             )}
                             <span>By {scene.userName || 'Unknown'}</span>
                           </div>
                         )}
                      </div>

                      {scene.mediaType === "video" && !scene.reelId && (
                        <div className="absolute top-2 right-2 p-1.5 bg-black/40 backdrop-blur-md rounded-lg">
                          <Film className="w-3 h-3 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-800 rounded-full flex items-center justify-center mb-4">
                    <Film className="w-8 h-8 text-zinc-400 opacity-50" />
                  </div>
                  <h4 className="text-zinc-900 dark:text-white font-bold mb-1">No scenes yet</h4>
                  <p className="text-zinc-500 text-sm max-w-[200px]">This character hasn't starred in any scenes yet.</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 flex justify-center">
              <button 
                onClick={() => setIsCharacterScenesOpen(false)}
                className="px-8 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Close View
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Scene Viewer Modal */}
      {isSceneViewOpen && viewingScene && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => { setIsSceneViewOpen(false); setViewingScene(null); }}
          />
          <div className="bg-white dark:bg-zinc-900 w-full max-w-3xl rounded-2xl overflow-hidden shadow-2xl relative z-10 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-zinc-900 dark:text-white">{viewingScene.sceneTitle}</h2>
                {viewingScene.sceneDescription && (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-0.5">{viewingScene.sceneDescription}</p>
                )}
              </div>
              <button
                onClick={() => { setIsSceneViewOpen(false); setViewingScene(null); }}
                className="p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg className="w-6 h-6 text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Media */}
            <div className="flex-1 flex items-center justify-center bg-zinc-100 dark:bg-zinc-950 p-4 overflow-hidden">
              {viewingScene.mediaType === 'image' ? (
                <img
                  src={viewingScene.mediaUrl}
                  alt={viewingScene.sceneTitle}
                  className="max-w-full max-h-[70vh] object-contain rounded-lg"
                />
              ) : (
                <video
                  src={viewingScene.mediaUrl}
                  controls
                  autoPlay
                  className="max-w-full max-h-[70vh] rounded-lg"
                />
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-200 dark:border-zinc-800 flex justify-between items-center">
              <span className="text-sm text-zinc-500 dark:text-zinc-400">
                {viewingScene.mediaType === 'image' ? '🎨 Image' : '🎬 Video'}
              </span>
              <button
                onClick={() => { setIsSceneViewOpen(false); setViewingScene(null); }}
                className="px-6 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-full font-bold text-sm shadow-lg hover:opacity-90 active:scale-95 transition-all"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {profileUser && (
        <ReportModal
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
          reportedId={profileUser._id}
        />
      )}
    </main>
  );
}
