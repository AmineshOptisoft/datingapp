import { useEffect, useState } from "react";
import { AIProfileOverview, AudienceSegment } from "@/types/ai-profile";

interface UseProfilesResult {
  profiles: AIProfileOverview[];
  loading: boolean;
  error: string | null;
}

export function useProfiles(segment: AudienceSegment): UseProfilesResult {
  const [profiles, setProfiles] = useState<AIProfileOverview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const controller = new AbortController();

    async function fetchProfiles() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/ai-profiles/public?segment=${segment}`,
          { signal: controller.signal }
        );

        if (!response.ok) {
          throw new Error("Failed to load profiles");
        }

        const payload = await response.json();
        if (!cancelled) {
          setProfiles(payload.data || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Unable to fetch profiles");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfiles();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [segment]);

  return { profiles, loading, error };
}

