import { useState } from "react";
import { Upload } from "lucide-react";

interface CreatePersonaDialogProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function CreatePersonaDialog({ onSuccess, onClose }: CreatePersonaDialogProps) {
  const [displayName, setDisplayName] = useState("");
  const [background, setBackground] = useState("");
  const [makeDefault, setMakeDefault] = useState(false);
  const [avatar, setAvatar] = useState<string | null>(null);
  const [showAvatarMenu, setShowAvatarMenu] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatar(reader.result as string);
        setShowAvatarMenu(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGenerateImage = () => {
    // TODO: Integrate AI image generation
    alert("AI image generation coming soon!");
    setShowAvatarMenu(false);
  };

  const handleSave = async () => {
    try {
      if (!displayName.trim()) {
        alert("Display name is required");
        return;
      }

      // Get user ID from localStorage
      const storedUser = localStorage.getItem("user");
      if (!storedUser) {
        alert("User not found. Please login again.");
        return;
      }

      const user = JSON.parse(storedUser);
      const userId = user._id || user.id || user.userId;

      if (!userId) {
        alert("User ID not found. Please try logging out and logging back in.");
        return;
      }

      const personaData = {
        userId,
        displayName: displayName.trim(),
        background: background.trim(),
        makeDefault,
        avatar,
      };

      console.log("Saving persona:", personaData);

      const response = await fetch("/api/personas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(personaData),
      });

      const data = await response.json();

      if (!response.ok) {
        alert(data.error || "Failed to save persona");
        return;
      }

      alert("Persona saved successfully!");
      onSuccess();
    } catch (error) {
      console.error("Error saving persona:", error);
      alert("An error occurred while saving the persona");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-bold">Persona</h2>
        <button
          onClick={onClose}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-white transition-colors"
        >
          ✕
        </button>
      </div>

      {/* Info Section */}
      <div className="space-y-2 mb-4 bg-zinc-100 dark:bg-zinc-800 rounded-lg p-3">
        <div className="flex items-start gap-2">
          <div className="bg-zinc-200 dark:bg-zinc-700 rounded-full p-1.5 mt-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Characters will remember your persona information to improve their conversations with you
          </p>
        </div>
        
        <div className="flex items-start gap-2">
          <div className="bg-zinc-200 dark:bg-zinc-700 rounded-full p-1.5 mt-0.5">
            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path d="M7 9a2 2 0 012-2h6a2 2 0 012 2v6a2 2 0 01-2 2H9a2 2 0 01-2-2V9z" />
              <path d="M5 3a2 2 0 00-2 2v6a2 2 0 002 2V5h8a2 2 0 00-2-2H5z" />
            </svg>
          </div>
          <p className="text-sm text-zinc-600 dark:text-zinc-300">
            Create multiple personas to change your background info between chats
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="flex-1 space-y-4 overflow-y-auto">
        {/* Avatar Upload with Menu */}
        <div className="flex items-center gap-3">
          <div className="relative">
            {/* Avatar */}
            <button
              onClick={() => setShowAvatarMenu(!showAvatarMenu)}
              className="w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center overflow-hidden cursor-pointer hover:opacity-90 transition-opacity"
            >
              {avatar ? (
                <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-white">
                  {displayName.charAt(0).toUpperCase() || "S"}
                </span>
              )}
            </button>

            {/* Edit Icon */}
            <div className="absolute bottom-0 right-0 bg-zinc-300 dark:bg-zinc-700 rounded-full p-1">
              <Upload className="w-2.5 h-2.5" />
            </div>

            {/* Dropdown Menu */}
            {showAvatarMenu && (
              <div className="absolute top-0 left-16 bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg shadow-lg overflow-hidden z-10 min-w-[160px]">
                <button
                  onClick={handleGenerateImage}
                  className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  Generate image
                </button>
                
                <label className="w-full px-3 py-2 text-left text-sm text-zinc-900 dark:text-white hover:bg-zinc-100 dark:hover:bg-zinc-700 transition-colors flex items-center gap-2 cursor-pointer">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  Upload image
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                  />
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Display Name */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Display Name
          </label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value.slice(0, 20))}
            placeholder="Your persona name"
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all"
            maxLength={20}
          />
          <p className="text-xs text-zinc-500 mt-1 text-right">{displayName.length}/20</p>
        </div>

        {/* Background */}
        <div>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1.5">
            Background
          </label>
          <textarea
            value={background}
            onChange={(e) => setBackground(e.target.value.slice(0, 750))}
            placeholder="Tell characters about yourself..."
            className="w-full bg-white dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded-lg px-3 py-2 text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all resize-none"
            rows={4}
            maxLength={750}
          />
          <p className="text-xs text-zinc-500 mt-1 text-right">{background.length}/750</p>
        </div>

        {/* Make Default Checkbox */}
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="makeDefault"
            checked={makeDefault}
            onChange={(e) => setMakeDefault(e.target.checked)}
            className="w-3.5 h-3.5 bg-white dark:bg-zinc-800 border-zinc-300 dark:border-zinc-700 rounded focus:ring-2 focus:ring-orange-500"
          />
          <label htmlFor="makeDefault" className="text-sm text-zinc-700 dark:text-zinc-300">
            Make default for new chats
          </label>
        </div>
      </div>

      {/* Save Button */}
      <div className="mt-4 flex justify-end">
        <button
          onClick={handleSave}
          className="px-5 py-2 bg-zinc-200 hover:bg-zinc-300 dark:bg-zinc-700 dark:hover:bg-zinc-600 text-zinc-900 dark:text-white rounded-lg text-sm font-medium transition-colors"
        >
          Save
        </button>
      </div>
    </div>
  );
}
