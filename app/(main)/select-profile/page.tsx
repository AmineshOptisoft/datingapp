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
    <div className="min-h-screen bg-gradient-to-br from-pink-50 to-purple-50">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            Welcome to AI Dating! 💕
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Meet amazing people and have interesting conversations. 
            Choose someone you'd like to chat with and start your journey!
          </p>
        </div>

        {/* Profile Selector */}
        <AIProfileSelector 
          onProfileSelect={handleProfileSelect}
          selectedProfileId={selectedProfileId}
        />

        {/* Start Chat Button */}
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

        {/* Instructions */}
        {/* <div className="mt-12 bg-white rounded-lg shadow-md p-6 max-w-2xl mx-auto">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            How it works:
          </h3>
          <div className="space-y-3 text-gray-600">
            <div className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                1
              </span>
              <p>Browse through the available profiles and read their bios</p>
            </div>
            <div className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                2
              </span>
              <p>Click on a profile that interests you to select them</p>
            </div>
            <div className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                3
              </span>
              <p>Hit "Start Chatting" to begin your conversation</p>
            </div>
            <div className="flex items-start">
              <span className="bg-pink-100 text-pink-600 rounded-full w-6 h-6 flex items-center justify-center text-sm font-semibold mr-3 mt-0.5">
                4
              </span>
              <p>Enjoy natural, engaging conversations!</p>
            </div>
          </div>
        </div> */}

        {/* Footer */}
        <div className="text-center mt-12 text-gray-500">
          <p>✨ All conversations are private and secure ✨</p>
        </div>
      </div>
    </div>
  );
}
