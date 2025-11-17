"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";

export default function InitializeProfiles() {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<string>("");
  const [profiles, setProfiles] = useState<any[]>([]);

  const handleInitialize = async () => {
    setLoading(true);
    setStatus("Initializing AI profiles...");
    
    try {
      const response = await fetch('/api/init-profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();

      if (data.success) {
        setStatus(`✅ Success! Created ${data.data.profilesCreated} AI profiles`);
        setProfiles(data.data.profiles);
        
        // Also test fetch after creation
        setTimeout(() => {
          testProfiles();
        }, 1000);
      } else {
        setStatus(`❌ Error: ${data.message}`);
        console.error('Initialization error:', data.error);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`);
      console.error('Error initializing profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const testProfiles = async () => {
    setLoading(true);
    setStatus("Testing profile fetch...");
    
    try {
      const response = await fetch('/api/ai-profiles/public');
      const data = await response.json();

      if (data.success) {
        setStatus(`✅ Found ${data.count} profiles available`);
        setProfiles(data.data);
      } else {
        setStatus(`❌ Error fetching profiles: ${data.message}`);
      }
    } catch (error) {
      setStatus(`❌ Network error: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const checkDatabase = async () => {
    setLoading(true);
    setStatus("Checking database connection...");
    
    try {
      const response = await fetch('/api/init-profiles');
      const data = await response.json();

      if (data.success) {
        setStatus(`✅ Database connected. ${data.message}`);
      } else {
        setStatus(`❌ Database issue: ${data.message}`);
      }
    } catch (error) {
      setStatus(`❌ Database connection failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-2xl mx-auto">
      <h3 className="text-xl font-semibold text-gray-800 mb-4">
        AI Profiles Setup 🚀
      </h3>
      
      <div className="space-y-4">
        <div className="flex gap-2 flex-wrap">
          <Button
            onClick={handleInitialize}
            disabled={loading}
            className="bg-pink-500 hover:bg-pink-600 text-white"
          >
            {loading ? "Initializing..." : "Initialize AI Profiles"}
          </Button>
          
          <Button
            onClick={testProfiles}
            disabled={loading}
            className="bg-blue-500 hover:bg-blue-600 text-white"
          >
            {loading ? "Testing..." : "Test Profile Fetch"}
          </Button>

          <Button
            onClick={checkDatabase}
            disabled={loading}
            className="bg-green-500 hover:bg-green-600 text-white"
          >
            {loading ? "Checking..." : "Check Database"}
          </Button>
        </div>

        {status && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm font-medium">{status}</p>
          </div>
        )}

        {profiles.length > 0 && (
          <div className="space-y-2">
            <h4 className="font-medium text-gray-800">Available Profiles:</h4>
            {profiles.map((profile, index) => (
              <div key={index} className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <span className="text-sm font-medium text-pink-600">
                      {profile.name?.charAt(0) || index + 1}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {profile.name} ({profile.age})
                    </p>
                    <p className="text-sm text-gray-600">
                      {profile.profession} • {profile.location}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
