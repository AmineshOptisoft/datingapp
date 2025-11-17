"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

interface AIProfile {
  id: string;
  name: string;
  age: number;
  profession: string;
  avatar: string;
  tagline: string;
}

export default function QuickProfilePreview() {
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/ai-profiles/public');
      const data = await response.json();
      
      if (data.success) {
        // Show only first 3 profiles as preview
        setProfiles(data.data.slice(0, 3));
      } else {
        console.error('Failed to fetch profiles:', data.message);
      }
    } catch (error) {
      console.error('Error fetching profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickChat = (profileId: string) => {
    router.push(`/messages?ai=${profileId}`);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-lg p-6">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 rounded mb-4"></div>
          <div className="space-y-3">
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
            <div className="h-20 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-800">
          Quick Chat 💬
        </h3>
        <Button
          onClick={() => router.push('/select-profile')}
          className="text-sm bg-pink-500 hover:bg-pink-600 text-white px-4 py-2"
        >
          View All
        </Button>
      </div>

      <div className="space-y-4">
        {profiles.map((profile) => (
          <div
            key={profile.id}
            className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <div className="relative">
              <img
                src={profile.avatar || '/default-avatar.jpg'}
                alt={profile.name}
                className="w-12 h-12 rounded-full object-cover"
                onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                  (e.target as HTMLImageElement).src = '/default-avatar.jpg';
                }}
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white"></div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center space-x-2">
                <h4 className="font-medium text-gray-900 truncate">
                  {profile.name}
                </h4>
                <span className="text-sm text-gray-500">
                  {profile.age}
                </span>
              </div>
              <p className="text-sm text-gray-600 truncate">
                {profile.tagline}
              </p>
            </div>

            <Button
              onClick={() => handleQuickChat(profile.id)}
              className="bg-pink-500 hover:bg-pink-600 text-white px-3 py-1 text-sm"
            >
              Chat
            </Button>
          </div>
        ))}
      </div>

      {profiles.length === 0 && (
        <div className="text-center py-8">
          <p className="text-gray-500 mb-4">No profiles available</p>
          <Button
            onClick={fetchProfiles}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            Retry
          </Button>
        </div>
      )}
    </div>
  );
}
