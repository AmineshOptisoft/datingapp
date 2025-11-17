"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocket } from "@/lib/socket";
import AIProfileSelector from "@/components/features/ai-profiles/AIProfileSelector";
import { Button } from "@/components/ui/Button";

export default function DashboardPage() {
  const router = useRouter();
  const { disconnectSocket, setUserId } = useSocket();
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    disconnectSocket();
    setUserId("");
    router.push("/login");
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
    <div className="min-h-screen flex bg-gradient-to-br from-pink-100 via-purple-100 to-blue-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-lg p-6 flex flex-col justify-between">
        <div className="flex flex-col space-y-6">
          <h2 className="text-2xl font-bold text-purple-700 mb-8">Menu</h2>

          <button
            onClick={() => router.push("/profile")}
            className="py-3 px-6 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition"
          >
            Profile
          </button>

          <button
            onClick={() => router.push("/select-profile")}
            className="py-3 px-6 rounded-lg bg-pink-500 text-white font-semibold hover:bg-pink-600 transition"
          >
            Find Someone to Chat
          </button>

          <button
            onClick={() => router.push("/messages")}
            className="py-3 px-6 rounded-lg bg-purple-500 text-white font-semibold hover:bg-purple-600 transition"
          >
            My Conversations
          </button>
        </div>

        <button
          onClick={handleLogout}
          className="py-3 px-6 rounded-lg bg-red-500 text-white font-semibold hover:bg-red-600 transition"
        >
          Logout
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-12">
        <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-pink-600 to-purple-700 mb-4">
          Welcome to AI Dating! 💕
        </h1>
        <p className="text-lg text-gray-700 max-w-3xl mb-8">
          Connect with amazing people and have meaningful conversations. 
          Choose from our curated profiles and start chatting instantly!
        </p>

        {/* Quick Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
          <div 
            onClick={() => router.push("/select-profile")}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-l-4 border-pink-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-3 rounded-full">
                <span className="text-2xl">💕</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 ml-3">Find Someone</h3>
            </div>
            <p className="text-gray-600">
              Browse through 5 amazing profiles and find someone special to chat with.
            </p>
          </div>

          <div 
            onClick={() => router.push("/messages")}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-l-4 border-purple-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-full">
                <span className="text-2xl">💬</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 ml-3">My Chats</h3>
            </div>
            <p className="text-gray-600">
              Continue your ongoing conversations and see your message history.
            </p>
          </div>

          <div 
            onClick={() => router.push("/profile")}
            className="bg-white rounded-lg shadow-lg p-6 cursor-pointer hover:shadow-xl transition-shadow duration-300 border-l-4 border-blue-500"
          >
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-full">
                <span className="text-2xl">👤</span>
              </div>
              <h3 className="text-xl font-semibold text-gray-800 ml-3">My Profile</h3>
            </div>
            <p className="text-gray-600">
              Update your profile information and manage your account settings.
            </p>
          </div>
        </div>

        {/* AI Profile Selector embedded on dashboard */}
        <div className="mt-12 bg-white/70 rounded-2xl p-6 shadow-lg">
          <AIProfileSelector
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfileId}
          />
        </div>

        {/* Start Chat button (same behavior as select-profile page) */}
        {selectedProfileId && (
          <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
            <Button
              onClick={handleStartChat}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg text-lg font-semibold"
            >
              {loading ? (
                <div className="flex items-center">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                  Starting Chat...
                </div>
              ) : (
                "Start Chatting 💬"
              )}
            </Button>
          </div>
        )}
      </main>
    </div>
  );
}
