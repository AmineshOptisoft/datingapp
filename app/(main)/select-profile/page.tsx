"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import AIProfileSelector from "@/components/features/ai-profiles/AIProfileSelector";
import { Button } from "@/components/ui/Button";

export default function SelectProfilePage() {
  const [selectedProfileId, setSelectedProfileId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      // Get detailed profile information
      const response = await fetch('/api/ai-profiles/public', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ profileId: selectedProfileId }),
      });

      const data = await response.json();

      if (data.success) {
        // Store selected profile in localStorage for chat initialization
        localStorage.setItem('selectedAIProfile', JSON.stringify(data.data));
        
        // Navigate to chat page
        router.push(`/messages?ai=${selectedProfileId}`);
      } else {
        alert(data.message || 'Failed to start chat');
      }
    } catch (error) {
      console.error('Error starting chat:', error);
      alert('Network error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="px-4 md:px-8 py-6 space-y-8">
      {/* Header */}
      <section className="bg-zinc-900/60 border border-white/10 rounded-2xl p-6 md:p-8 shadow-xl">
        <div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-white mb-2">
            Choose Your AI Girlfriend 💕
          </h1>
          <p className="text-zinc-300 max-w-2xl mx-auto text-sm md:text-base">
            Browse through carefully crafted AI companions and pick someone who matches your vibe.
          </p>
        </div>

        <div className="mt-6">
          <AIProfileSelector
            onProfileSelect={handleProfileSelect}
            selectedProfileId={selectedProfileId}
          />
        </div>

        {selectedProfileId && (
          <div className="mt-6 flex justify-center">
            <Button
              onClick={handleStartChat}
              disabled={loading}
              className="bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white px-8 py-3 rounded-full shadow-lg text-sm md:text-base font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  <span>Starting Chat...</span>
                </div>
              ) : (
                "Start Chatting 💬"
              )}
            </Button>
          </div>
        )}
      </section>
    </main>
  );
}
