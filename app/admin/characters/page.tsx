"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
  Search,
  Pencil,
  Film,
  X,
  Upload,
  ChevronLeft,
  ChevronRight,
  Eye,
  Heart,
  MessageCircle,
  UserCircle,
} from "lucide-react";
import { toast } from "sonner";

interface CharacterData {
  userId: string;
  userName: string;
  userEmail: string;
  userAvatar: string | null;
  character: {
    _id: string;
    characterName: string;
    characterImage: string | null;
    characterAge: number;
    characterGender: string;
    language: string;
    tags: string[];
    description: string;
    personality: string;
    scenario: string;
    firstMessage: string;
    visibility: string;
    likes: number;
    interactions: number;
    createdAt: string;
  };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export default function AdminCharactersPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [characters, setCharacters] = useState<CharacterData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1 , limit: 20, total: 0, totalPages: 0 });
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  // Edit Modal
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingChar, setEditingChar] = useState<CharacterData | null>(null);
  const [editForm, setEditForm] = useState({
    characterName: "",
    characterAge: 18,
    characterGender: "female",
    language: "English",
    description: "",
    personality: "",
    scenario: "",
    firstMessage: "",
    visibility: "public",
    tags: "",
  });

  // Create Reel Modal
  const [showReelModal, setShowReelModal] = useState(false);
  const [reelChar, setReelChar] = useState<CharacterData | null>(null);
  const [reelFile, setReelFile] = useState<File | null>(null);
  const [reelFilePreview, setReelFilePreview] = useState("");
  const [reelCaption, setReelCaption] = useState("");
  const [reelSceneTitle, setReelSceneTitle] = useState("");
  const [reelSceneDesc, setReelSceneDesc] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchCharacters = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: "20" });
      if (search) params.set("search", search);

      const res = await fetch(`/api/admin/characters?${params}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setCharacters(data.characters);
        setPagination(data.pagination);
      }
    } catch (err) {
      toast.error("Failed to load characters");
    } finally {
      setLoading(false);
    }
  }, [token, search]);

  useEffect(() => {
    if (token) fetchCharacters();
  }, [token, fetchCharacters]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchCharacters(1);
  };

  const openEditModal = (char: CharacterData) => {
    setEditingChar(char);
    setEditForm({
      characterName: char.character.characterName,
      characterAge: char.character.characterAge,
      characterGender: char.character.characterGender,
      language: char.character.language,
      description: char.character.description,
      personality: char.character.personality,
      scenario: char.character.scenario || "",
      firstMessage: char.character.firstMessage,
      visibility: char.character.visibility,
      tags: char.character.tags?.join(", ") || "",
    });
    setShowEditModal(true);
  };

  const handleEditSave = async () => {
    if (!editingChar) return;
    setSubmitting(true);
    try {
      const res = await fetch(`/api/admin/characters/${editingChar.userId}/${editingChar.character._id}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          ...editForm,
          characterAge: Number(editForm.characterAge),
          tags: editForm.tags.split(",").map((t) => t.trim()).filter(Boolean),
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Character updated");
        setShowEditModal(false);
        fetchCharacters(pagination.page);
      } else {
        toast.error(data.error || "Failed to update");
      }
    } catch (err) {
      toast.error("Failed to update character");
    } finally {
      setSubmitting(false);
    }
  };

  const openReelModal = (char: CharacterData) => {
    setReelChar(char);
    setReelFile(null);
    setReelFilePreview("");
    setReelCaption("");
    setReelSceneTitle("");
    setReelSceneDesc("");
    setShowReelModal(true);
  };

  const handleReelFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReelFile(file);
      if (file.type.startsWith("image/")) {
        setReelFilePreview(URL.createObjectURL(file));
      } else {
        setReelFilePreview("video");
      }
    }
  };

  const handleCreateReel = async () => {
    if (!reelChar || !reelFile) return toast.error("Please select a file");
    if (!reelSceneTitle) return toast.error("Scene title is required");

    setSubmitting(true);
    try {
      // 1. Upload the file
      const fd = new FormData();
      fd.append("file", reelFile);
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error);

      // 2. Create scene
      const sceneRes = await fetch("/api/admin/scenes", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: reelChar.userId,
          characterId: reelChar.character._id,
          sceneTitle: reelSceneTitle,
          sceneDescription: reelSceneDesc || reelSceneTitle,
          mediaType: uploadData.mediaType,
          mediaUrl: uploadData.url,
        }),
      });
      const sceneData = await sceneRes.json();
      if (!sceneData.success) throw new Error(sceneData.error);

      // 3. Publish as reel
      const reelRes = await fetch("/api/admin/reels", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: reelChar.userId,
          sceneId: sceneData.scene._id,
          mediaUrl: uploadData.url,
          mediaType: uploadData.mediaType,
          caption: reelCaption || reelSceneTitle,
        }),
      });
      const reelData = await reelRes.json();
      if (!reelData.success) throw new Error(reelData.error);

      toast.success("Reel created successfully!");
      setShowReelModal(false);
    } catch (err: any) {
      toast.error(err.message || "Failed to create reel");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Character List</h1>
        <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{pagination.total} total characters across all users</p>
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by character or creator name..."
          className={`w-full pl-11 pr-4 py-3 border rounded-xl placeholder-zinc-500 focus:border-pink-500/50 focus:outline-none focus:ring-1 focus:ring-pink-500/30 transition-all text-sm ${
            isDark ? 'bg-white/5 border-white/10 text-white' : 'bg-white border-gray-200 text-gray-900'
          }`}
        />
      </form>

      {/* Characters Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className={`h-[420px] rounded-2xl animate-pulse border ${isDark ? 'bg-white/5 border-white/10' : 'bg-gray-100 border-gray-200'}`} />
            ))
          : characters.length === 0
          ? (
            <div className={`col-span-full text-center py-16 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>No characters found</div>
          )
          : characters.map((item) => (
              <div
                key={`${item.userId}-${item.character._id}`}
                className={`border rounded-2xl overflow-hidden transition-all group flex flex-col ${
                  isDark ? 'bg-white/[0.03] border-white/10 hover:border-white/20' : 'bg-white border-gray-200 hover:shadow-lg'
                }`}
              >
                {/* Character Image */}
                <div className="relative h-56 flex-shrink-0 bg-gradient-to-br from-pink-500/20 to-purple-600/20 overflow-hidden">
                  {item.character.characterImage ? (
                    <img
                      src={item.character.characterImage}
                      alt={item.character.characterName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <UserCircle className="w-16 h-16 text-zinc-600" />
                    </div>
                  )}
                  {/* Visibility Badge */}
                  <span className={`absolute top-3 right-3 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    item.character.visibility === "public"
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-zinc-500/20 text-zinc-400 border border-zinc-500/30"
                  }`}>
                    {item.character.visibility}
                  </span>
                </div>

                {/* Content */}
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className={`font-semibold text-base mb-1 truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.character.characterName}</h3>
                  <p className={`text-xs mb-3 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    {item.character.characterAge}y • {item.character.characterGender} • {item.character.language}
                  </p>

                  {/* Creator Info */}
                  <div className={`flex items-center gap-2 mb-3 p-2 rounded-lg ${isDark ? 'bg-white/5' : 'bg-gray-50'}`}>
                    {item.userAvatar ? (
                      <img src={item.userAvatar} alt={item.userName} className="w-6 h-6 rounded-full object-cover" />
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-pink-500/30 flex items-center justify-center text-[10px] text-white font-bold">
                        {item.userName.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className={`text-xs truncate ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>by {item.userName}</span>
                  </div>

                  {/* Stats */}
                  <div className={`flex items-center gap-4 mb-3 text-xs ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
                    <span className="flex items-center gap-1"><Heart className="w-3.5 h-3.5" />{item.character.likes || 0}</span>
                    <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{item.character.interactions || 0}</span>
                  </div>

                  {/* Tags */}
                  {item.character.tags?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.character.tags.slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 bg-pink-500/10 text-pink-400 rounded-full text-[10px] border border-pink-500/20">
                          {tag}
                        </span>
                      ))}
                      {item.character.tags.length > 3 && (
                        <span className={`px-2 py-0.5 rounded-full text-[10px] ${isDark ? 'bg-white/5 text-zinc-500' : 'bg-gray-100 text-gray-400'}`}>
                          +{item.character.tags.length - 3}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Spacer to push buttons to bottom */}
                  <div className="flex-1" />

                  {/* Actions - always at bottom */}
                  <div className="flex items-center gap-2 mt-auto">
                    <button
                      onClick={() => openEditModal(item)}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 border rounded-xl text-sm transition-all ${
                        isDark ? 'bg-white/5 border-white/10 text-zinc-300 hover:bg-white/10 hover:text-white' : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                      }`}
                    >
                      <Pencil className="w-3.5 h-3.5" />
                      Edit
                    </button>
                    <button
                      onClick={() => openReelModal(item)}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-pink-500/20 to-purple-600/20 border border-pink-500/30 rounded-xl text-sm text-pink-400 hover:from-pink-500/30 hover:to-purple-600/30 transition-all"
                    >
                      <Film className="w-3.5 h-3.5" />
                      Create Reel
                    </button>
                  </div>
                </div>
              </div>
            ))}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>
            Page {pagination.page} of {pagination.totalPages} ({pagination.total} characters)
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchCharacters(pagination.page - 1)}
              disabled={pagination.page <= 1}
              className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => fetchCharacters(pagination.page + 1)}
              disabled={pagination.page >= pagination.totalPages}
              className={`p-2 rounded-lg border transition-all disabled:opacity-30 disabled:cursor-not-allowed ${
                isDark ? 'border-white/10 text-zinc-400 hover:text-white hover:bg-white/5' : 'border-gray-200 text-gray-400 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ============ EDIT CHARACTER MODAL ============ */}
      {showEditModal && editingChar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowEditModal(false)}>
          <div className={`w-full max-w-2xl max-h-[90vh] flex flex-col border rounded-2xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className={`flex items-center justify-between p-6 border-b shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Edit Character</h3>
              <button onClick={() => setShowEditModal(false)} className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto p-6">
              <div className="space-y-6">

                {/* Character Name */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Character Name
                  </label>
                  <input
                    type="text"
                    value={editForm.characterName}
                    onChange={(e) => setEditForm({ ...editForm, characterName: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="e.g. Miles Morales"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">This is the character&apos;s display name.</p>
                </div>

                {/* Character Image */}
                <div className="flex gap-6">
                  <div className={`shrink-0 w-32 h-44 rounded-lg flex items-center justify-center overflow-hidden border ${
                    isDark ? 'bg-zinc-900 border-zinc-800' : 'bg-zinc-100 border-zinc-200'
                  }`}>
                    {editingChar.character.characterImage ? (
                      <img src={editingChar.character.characterImage} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle className="w-10 h-10 text-zinc-400" />
                    )}
                  </div>
                  <div className="flex-1 space-y-2">
                    <label className={`block text-sm font-bold ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                      Character Image
                    </label>
                    <p className="text-xs text-zinc-500 leading-relaxed">
                      The character image is managed from the character card. This preview shows the current image.
                    </p>
                  </div>
                </div>

                {/* Character Age */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Character Age
                  </label>
                  <input
                    type="number"
                    min={18}
                    max={150}
                    value={editForm.characterAge}
                    onChange={(e) => setEditForm({ ...editForm, characterAge: Number(e.target.value) })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">This is the character&apos;s age.</p>
                </div>

                {/* Character Gender */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Character Gender
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.characterGender}
                      onChange={(e) => setEditForm({ ...editForm, characterGender: e.target.value })}
                      className={`w-full text-sm appearance-none rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      } border`}
                    >
                      <option value="female">Female</option>
                      <option value="male">Male</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5">Select the character&apos;s gender. This determines where the character appears in public sections.</p>
                </div>

                {/* Language */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Language
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.language}
                      onChange={(e) => setEditForm({ ...editForm, language: e.target.value })}
                      className={`w-full text-sm appearance-none rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      } border`}
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Japanese">Japanese</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5">Select the language for the character&apos;s responses.</p>
                </div>

                {/* Visibility */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Visibility
                  </label>
                  <div className="relative">
                    <select
                      value={editForm.visibility}
                      onChange={(e) => setEditForm({ ...editForm, visibility: e.target.value })}
                      className={`w-full text-sm appearance-none rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                        isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                      } border`}
                    >
                      <option value="public">Public</option>
                      <option value="private">Private</option>
                      <option value="unlisted">Unlisted</option>
                    </select>
                  </div>
                  <p className="text-xs text-zinc-500 mt-1.5">Select whether the character should be publicly visible or not.</p>
                </div>

                {/* Tags */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Character Tags
                  </label>
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {editForm.tags.split(",").filter(t => t.trim()).map((tag) => (
                      <span key={tag.trim()} className={`inline-flex items-center gap-1 px-2 py-1.5 text-xs rounded-md ${
                        isDark ? 'bg-zinc-800 text-zinc-200' : 'bg-zinc-200 text-zinc-900'
                      }`}>
                        {tag.trim()}
                        <button
                          onClick={() => {
                            const newTags = editForm.tags.split(",").map(t => t.trim()).filter(t => t && t !== tag.trim()).join(", ");
                            setEditForm({ ...editForm, tags: newTags });
                          }}
                          className="hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editForm.tags}
                    onChange={(e) => setEditForm({ ...editForm, tags: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="romantic, funny, cute"
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">Comma-separated tags that describe this character.</p>
                </div>

                {/* Description */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Description
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="Write a brief overview of this character..."
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">Write a brief overview of the character.</p>
                </div>

                {/* Personality */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Personality
                  </label>
                  <textarea
                    rows={3}
                    value={editForm.personality}
                    onChange={(e) => setEditForm({ ...editForm, personality: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="Adventurous, witty, and kind-hearted..."
                  />
                  <p className="text-xs text-zinc-500 mt-1.5">Describe the character&apos;s traits, behavior, and demeanor.</p>
                </div>

                {/* Scenario */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    Scenario
                  </label>
                  <textarea
                    rows={6}
                    value={editForm.scenario}
                    onChange={(e) => setEditForm({ ...editForm, scenario: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="The scenario for the character..."
                  />
                </div>

                {/* First Message */}
                <div>
                  <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>
                    First Message
                  </label>
                  <textarea
                    rows={4}
                    value={editForm.firstMessage}
                    onChange={(e) => setEditForm({ ...editForm, firstMessage: e.target.value })}
                    className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all ${
                      isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                    } border`}
                    placeholder="The first message the character sends..."
                  />
                </div>

              </div>
            </div>

            {/* Footer */}
            <div className={`flex items-center justify-end gap-3 p-6 border-t shrink-0 ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <button
                onClick={() => setShowEditModal(false)}
                className={`px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'}`}
              >
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={submitting}
                className={`px-6 py-2.5 text-sm font-bold rounded-full hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed ${
                  isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                }`}
              >
                {submitting ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============ CREATE REEL MODAL ============ */}
      {showReelModal && reelChar && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setShowReelModal(false)}>
          <div className={`w-full max-w-lg border rounded-2xl shadow-2xl ${isDark ? 'bg-[#1a1a1a] border-white/10' : 'bg-white border-gray-200'}`} onClick={(e) => e.stopPropagation()}>
            <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <div>
                <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-zinc-900'}`}>Create Reel</h3>
                <p className="text-zinc-500 text-xs mt-1">For {reelChar.character.characterName} by {reelChar.userName}</p>
              </div>
              <button onClick={() => setShowReelModal(false)} className={`${isDark ? 'text-zinc-400 hover:text-white' : 'text-gray-400 hover:text-gray-900'} transition-colors`}>
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-5">
              {/* File Upload */}
              <div>
                <label className={`block text-sm font-bold mb-2 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Media File *</label>
                <label className={`flex flex-col items-center justify-center gap-3 h-40 border-2 border-dashed rounded-xl cursor-pointer transition-all ${
                  isDark ? 'border-white/20 hover:border-pink-500/40 bg-white/[0.02]' : 'border-gray-300 hover:border-pink-500/40 bg-gray-50'
                }`}>
                  {reelFilePreview ? (
                    reelFilePreview === "video" ? (
                      <div className="flex flex-col items-center gap-2">
                        <Film className="w-10 h-10 text-pink-400" />
                        <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{reelFile?.name}</span>
                      </div>
                    ) : (
                      <img src={reelFilePreview} alt="Preview" className="h-full object-contain rounded-lg" />
                    )
                  ) : (
                    <>
                      <Upload className={`w-8 h-8 ${isDark ? 'text-zinc-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Click to upload image or video</span>
                      <span className={`text-xs ${isDark ? 'text-zinc-600' : 'text-gray-400'}`}>JPEG, PNG, MP4, WebM (max 50MB)</span>
                    </>
                  )}
                  <input type="file" accept="image/*,video/*" className="hidden" onChange={handleReelFileChange} />
                </label>
              </div>

              <div>
                <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Scene Title *</label>
                <input
                  type="text" value={reelSceneTitle} onChange={(e) => setReelSceneTitle(e.target.value)}
                  className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  } border`}
                  placeholder="Evening at the beach"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Scene Description</label>
                <textarea
                  rows={2} value={reelSceneDesc} onChange={(e) => setReelSceneDesc(e.target.value)}
                  className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none resize-none transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  } border`}
                  placeholder="Optional description"
                />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${isDark ? 'text-zinc-100' : 'text-zinc-900'}`}>Caption</label>
                <input
                  type="text" value={reelCaption} onChange={(e) => setReelCaption(e.target.value)}
                  className={`w-full text-sm rounded-md px-3 py-2.5 focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 outline-none transition-all ${
                    isDark ? 'bg-zinc-900 border-zinc-800 text-zinc-100' : 'bg-zinc-50 border-zinc-300 text-zinc-900'
                  } border`}
                  placeholder="Reel caption..."
                />
              </div>
            </div>
            <div className={`flex items-center justify-end gap-3 p-6 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
              <button onClick={() => setShowReelModal(false)} className={`px-5 py-2.5 text-sm font-medium transition-colors ${isDark ? 'text-zinc-300 hover:text-white' : 'text-zinc-700 hover:text-zinc-900'}`}>Cancel</button>
              <button
                onClick={handleCreateReel} disabled={submitting || !reelFile}
                className={`px-6 py-2.5 text-sm font-bold rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity ${
                  isDark ? 'bg-white text-zinc-900' : 'bg-zinc-900 text-white'
                }`}
              >
                {submitting ? "Creating..." : "Create Reel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
