"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";
import { useAuth } from "@/app/contexts/AuthContext";
import AIProfileSelector from "@/components/features/ai-profiles/AIProfileSelector";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const { disconnectSocket, setUserId } = useSocket();
  const { user, logout } = useAuth();
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    // Use central auth logout so header + socket stay in sync
    disconnectSocket();
    setUserId("");
    logout();
  };

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
  };

  const handleStartChat = async () => {
    if (!selectedProfileId) {
      alert("Please select a profile first!");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/ai-profiles/public", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ profileId: selectedProfileId }),
      });

      const data = await response.json();

      if (data.success) {
        localStorage.setItem("selectedAIProfile", JSON.stringify(data.data));
        router.push(`/messages?ai=${selectedProfileId}`);
      } else {
        alert(data.message || "Failed to start chat");
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      alert("Network error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 md:px-8 py-6 space-y-8">
      {/* Hero / Welcome section */}
      <section className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
              Welcome back{user?.name ? `, ${user.name}` : ""} 💕
            </h1>
            <p className="text-zinc-300 max-w-2xl">
              Choose your favourite AI girlfriend, start a private chat, and continue your ongoing
              conversations in one place.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.push("/messages")}
              className="px-4 py-2 rounded-full text-sm font-medium bg-pink-600 hover:bg-pink-700 text-white transition-colors"
            >
              Open Chats
            </button>
            <button
              onClick={handleLogout}
              className="px-4 py-2 rounded-full text-sm font-medium bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => router.push("/select-profile")}
            className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-pink-500/60 hover:bg-zinc-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-pink-500/20 flex items-center justify-center">
              <span className="text-lg">💕</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">Find Someone to Chat</p>
              <p className="text-xs text-zinc-400">Browse AI profiles and pick your companion.</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-purple-500/60 hover:bg-zinc-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <span className="text-lg">💬</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">My Conversations</p>
              <p className="text-xs text-zinc-400">Jump back into your latest chats.</p>
            </div>
          </button>

          <button
            onClick={() => router.push("/profile")}
            className="bg-zinc-900/60 border border-white/10 rounded-xl p-4 flex items-center gap-3 hover:border-blue-500/60 hover:bg-zinc-900 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <span className="text-lg">👤</span>
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-white">My Profile</p>
              <p className="text-xs text-zinc-400">Update your details & preferences.</p>
            </div>
          </button>
        </div>
      </section>

      {/* Main dashboard content */}
      <section className="grid grid-cols-1 lg:grid-cols-[minmax(0,2fr)_minmax(0,1.1fr)] gap-6 items-start">
        {/* AI Profile selector */}
        <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 md:p-7 shadow-xl">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-white">Choose Someone to Chat With</h2>
              <p className="text-xs md:text-sm text-zinc-400">
                Select a profile below to start an emotionally engaging AI conversation.
              </p>
            </div>
          </div>

          <AIProfileSelector
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfileId}
          />
        </div>

        {/* Start chat panel */}
        <div className="space-y-4">
          <div className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between h-full min-h-[200px]">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-white mb-1">Start Chatting</h3>
              <p className="text-sm text-zinc-400">
                Pick a profile on the left, then launch a private chat room powered by your AI
                girlfriend.
              </p>
            </div>

            <div className="mt-auto">
              <Button
                onClick={handleStartChat}
                disabled={loading || !selectedProfileId}
                className="w-full bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-6 py-3 rounded-full shadow-lg text-sm font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                    <span>Starting Chat...</span>
                  </div>
                ) : selectedProfileId ? (
                  "Start Chatting 💬"
                ) : (
                  "Select a profile first"
                )}
              </Button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
