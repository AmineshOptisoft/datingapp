"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Grid, Film, User, MessageSquare } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

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

  useEffect(() => {
    if (!userId) return;
    fetchProfile();
  }, [userId]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/users/${userId}`);
      const data = await res.json();

      if (!data.success) {
        setError(data.error || "User not found");
        return;
      }

      setProfileUser(data.user);
      setCharacters(data.characters || []);
      setScenes(data.scenes || []);
    } catch {
      setError("Failed to load profile");
    } finally {
      setLoading(false);
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

        {/* Name */}
        <div className="text-center space-y-1">
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

        {/* Stats */}
        <div className="flex items-center space-x-6 text-sm text-zinc-500 font-medium">
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">0</span> Followers
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors">
            <span className="font-bold text-zinc-900 dark:text-white">0</span> Following
          </div>
          <div className="w-1 h-1 rounded-full bg-zinc-300 dark:bg-zinc-700" />
          <div className="hover:text-zinc-800 dark:hover:text-zinc-300 cursor-pointer transition-colors flex items-center gap-1">
            <MessageSquare className="w-3 h-3" />
            <span>0 Interactions</span>
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
                      className="bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden hover:shadow-lg hover:border-zinc-300 dark:hover:border-zinc-700 transition-all group"
                    >
                      {/* Image */}
                      <div className="relative h-48 bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                        {character.characterImage ? (
                          <img
                            src={character.characterImage}
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
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        {scene.mediaType === "video" && (
                          <div className="absolute top-2 right-2 bg-black/60 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full">
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
    </main>
  );
}
