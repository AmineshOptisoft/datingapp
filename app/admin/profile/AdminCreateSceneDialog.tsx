"use client";

import { useState } from "react";
import { Upload, X, Loader2, User, Film } from "lucide-react";
import { toast } from "sonner";

interface AdminCreateSceneDialogProps {
  userId: string;
  characters?: any[];
  onSuccess: () => void;
  onClose: () => void;
}

export default function AdminCreateSceneDialog({
  userId,
  characters,
  onSuccess,
  onClose,
}: AdminCreateSceneDialogProps) {
  const [selectedCharacterId, setSelectedCharacterId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string>("");
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      if (selectedFile.type.startsWith("image/")) {
        setFilePreview(URL.createObjectURL(selectedFile));
      } else {
        // Just show a string or icon indicating video
        setFilePreview("video");
      }
    }
  };

  const handleCreateScene = async () => {
    if (!file) return toast.error("Please upload a media file.");
    if (!sceneTitle.trim()) return toast.error("Scene title is required.");

    setSubmitting(true);
    try {
      const token = localStorage.getItem("token");
      
      // 1. Upload File
      const formData = new FormData();
      formData.append("file", file);
      
      const uploadRes = await fetch("/api/admin/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });
      const uploadData = await uploadRes.json();
      if (!uploadData.success) throw new Error(uploadData.error || "Failed to upload media");

      // 2. Create Scene directly via Admin route
      const sceneRes = await fetch("/api/admin/scenes", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          userId,
          characterId: selectedCharacterId || undefined,
          sceneTitle,
          sceneDescription: sceneDescription || sceneTitle,
          mediaType: uploadData.mediaType,
          mediaUrl: uploadData.url,
        }),
      });

      const sceneData = await sceneRes.json();
      if (!sceneData.success) {
        throw new Error(sceneData.error || "Failed to create scene in DB");
      }

      toast.success("Scene created successfully for user!");
      onSuccess();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-2xl max-w-lg w-full max-h-[90vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 dark:text-white">Admin Upload Scene</h2>
          <p className="text-xs text-zinc-500 mt-1">Bypasses wallet deduction & AI generation</p>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5 space-y-6">
        {/* Character Selection */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              Which character is this for? (Optional)
            </p>
            <button
              onClick={() => setSelectedCharacterId(null)}
              className="text-xs text-zinc-500 hover:text-zinc-900 dark:hover:text-white underline"
            >
              Clear
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
            {characters?.map((char: any) => (
              <button
                key={char._id}
                onClick={() => setSelectedCharacterId(char._id)}
                className={`flex-shrink-0 flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                  selectedCharacterId === char._id
                    ? "border-pink-500 bg-pink-50 dark:bg-pink-500/10"
                    : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
                }`}
              >
                <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border-2 border-zinc-200 dark:border-zinc-700">
                  {char.characterImage ? (
                    <img src={char.characterImage} alt={char.characterName} className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-6 h-6 text-zinc-400 m-3.5" />
                  )}
                </div>
                <span className="text-[10px] font-medium truncate w-16 text-center text-zinc-700 dark:text-zinc-300">
                  {char.characterName}
                </span>
              </button>
            ))}
            
            {/* None Option */}
            <button
              onClick={() => setSelectedCharacterId(null)}
              className={`flex-shrink-0 flex flex-col items-center gap-2 p-2 rounded-xl border-2 transition-all ${
                selectedCharacterId === null
                  ? "border-zinc-900 dark:border-white bg-zinc-50 dark:bg-zinc-800"
                  : "border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
              }`}
            >
              <div className="w-14 h-14 rounded-full overflow-hidden bg-zinc-100 dark:bg-zinc-800 border border-dotted border-zinc-400 dark:border-zinc-600 flex items-center justify-center">
                <span className="text-zinc-400 text-xs">None</span>
              </div>
              <span className="text-[10px] font-medium text-center text-zinc-600 dark:text-zinc-400">No Character</span>
            </button>
          </div>
        </div>

        {/* File Upload Dropzone */}
        <div>
          <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Media File *
          </label>
          <label className="flex flex-col items-center justify-center gap-3 h-48 border-2 border-dashed border-zinc-300 dark:border-zinc-700 hover:border-pink-500/50 bg-zinc-50 dark:bg-zinc-800/50 rounded-xl cursor-pointer transition-all">
            {filePreview ? (
              filePreview === "video" ? (
                <div className="flex flex-col items-center gap-2">
                  <Film className="w-12 h-12 text-pink-500" />
                  <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">{file?.name}</span>
                </div>
              ) : (
                <img src={filePreview} alt="Preview" className="h-full object-contain rounded-lg p-2" />
              )
            ) : (
              <>
                <Upload className="w-10 h-10 text-zinc-400" />
                <div className="text-center">
                  <span className="block text-sm font-medium text-zinc-600 dark:text-zinc-300">Click to upload image or video</span>
                  <span className="block text-xs text-zinc-400 mt-1">JPEG, PNG, MP4, WebM (max 50MB)</span>
                </div>
              </>
            )}
            <input type="file" accept="image/*,video/*" className="hidden" onChange={handleFileChange} />
          </label>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Scene Title *
          </label>
          <input
            type="text"
            value={sceneTitle}
            onChange={(e) => setSceneTitle(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all text-sm"
            placeholder="e.g. Surfing at dawn"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
            Scene Description
          </label>
          <textarea
            rows={3}
            value={sceneDescription}
            onChange={(e) => setSceneDescription(e.target.value)}
            className="w-full bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 rounded-lg px-4 py-2.5 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all resize-none text-sm"
            placeholder="Brief details about the scene..."
          />
        </div>
      </div>

      {/* Footer */}
      <div className="p-5 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900 shrink-0 flex items-center justify-end gap-3">
        <button
          type="button"
          onClick={onClose}
          className="px-5 py-2.5 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleCreateScene}
          disabled={submitting || !file}
          className="px-6 py-2.5 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white rounded-xl text-sm font-medium transition-all flex items-center justify-center gap-2 hover:opacity-90 disabled:opacity-70 disabled:cursor-not-allowed shadow-md"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Uploading...
            </>
          ) : (
            "Upload & Create Scene"
          )}
        </button>
      </div>
    </div>
  );
}
