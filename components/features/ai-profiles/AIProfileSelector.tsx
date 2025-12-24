"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface AIProfile {
  id: string;
  name: string;
  age: number;
  profession: string;
  location: string;
  avatar: string;
  bio: string;
  tagline: string;
  interests: string[];
  profileType: string;
}

interface AIProfileSelectorProps {
  onProfileSelect: (profileId: string) => void;
  selectedProfileId?: string;
}

export default function AIProfileSelector({
  onProfileSelect,
  selectedProfileId
}: AIProfileSelectorProps) {
  const router = useRouter();
  const [profiles, setProfiles] = useState<AIProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchAIProfiles();
  }, []);

  const fetchAIProfiles = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/ai-profiles/public');

      const data = await response.json();

      if (data.success) {
        setProfiles(data.data);
      } else {
        setError(data.message || 'Failed to fetch profiles');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching AI profiles:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleProfileSelect = (profileId: string) => {
    onProfileSelect(profileId);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-pink-500"></div>
        <span className="ml-2 text-gray-600">Loading profiles...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-8">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={fetchAIProfiles} className="bg-pink-500 hover:bg-pink-600">
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-2">
          Choose Someone to Chat With
        </h2>
        <p className="text-gray-600">
          Select a profile to start an interesting conversation
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {profiles.map((profile) => (
          <Card
            key={profile.id}
            className={`cursor-pointer transition-all duration-300 hover:shadow-lg hover:scale-105 ${selectedProfileId === profile.id
                ? 'ring-2 ring-pink-500 shadow-lg'
                : 'hover:shadow-md'
              }`}
            onClick={() => {
              handleProfileSelect(profile.id);
              router.push(`/ai-profile/${profile.id}`);
            }}
          >
            <div className="relative">
              {/* Profile Image */}
              <div className="aspect-square rounded-t-lg overflow-hidden bg-gray-200">
                <img
                  src={profile.avatar || 'https://img.freepik.com/premium-psd/avatar-portraits-with-digital-enhancements_1297808-1612.jpg?w=1380'}
                  alt={profile.name}
                  className="w-full h-full object-cover"
                  onError={(e: React.SyntheticEvent<HTMLImageElement>) => {
                    (e.target as HTMLImageElement).src = 'https://img.freepik.com/premium-psd/avatar-portraits-with-digital-enhancements_1297808-1612.jpg?w=1380';
                  }}
                />
              </div>

              {/* Online Status Indicator */}
              <div className="absolute top-3 right-3">
                <div className="w-3 h-3 bg-green-500 rounded-full border-2 border-white"></div>
              </div>
            </div>

            <div className="p-4">
              {/* Name and Age */}
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-gray-800">
                  {profile.name}
                </h3>
                <span className="text-sm text-gray-500">
                  {profile.age}
                </span>
              </div>

              {/* Tagline */}
              <p className="text-sm text-pink-600 font-medium mb-2">
                {profile.tagline}
              </p>

              {/* Profession and Location */}
              <div className="text-sm text-gray-600 mb-3">
                <p>{profile.profession}</p>
                <p>{profile.location}</p>
              </div>

              {/* Bio */}
              <p className="text-sm text-gray-700 mb-3 line-clamp-2">
                {profile.bio}
              </p>

              {/* Interests */}
              <div className="flex flex-wrap gap-1 mb-4">
                {profile.interests.slice(0, 3).map((interest, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-pink-100 text-pink-700 text-xs rounded-full"
                  >
                    {interest}
                  </span>
                ))}
                {profile.interests.length > 3 && (
                  <span className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                    +{profile.interests.length - 3} more
                  </span>
                )}
              </div>

              {/* Select Button */}
              <Button
                className={`w-full transition-colors duration-200 ${selectedProfileId === profile.id
                    ? 'bg-pink-600 hover:bg-pink-700 text-white'
                    : 'bg-pink-500 hover:bg-pink-600 text-white'
                  }`}
                onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
                  e.stopPropagation();
                  handleProfileSelect(profile.id);
                }}
              >
                {selectedProfileId === profile.id ? 'Selected ✓' : 'Start Chat'}
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {profiles.length === 0 && !loading && (
        <div className="text-center p-8">
          <p className="text-gray-500">No profiles available at the moment.</p>
          <Button
            onClick={fetchAIProfiles}
            className="mt-4 bg-pink-500 hover:bg-pink-600"
          >
            Refresh
          </Button>
        </div>
      )}
    </div>
  );
}
