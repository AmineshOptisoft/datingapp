import { useEffect, useState } from "react";
import type { AIProfileDetail, RoutePrefix } from "@/types/ai-profile";

interface UseProfileDetailResult {
  profile: AIProfileDetail | null;
  loading: boolean;
  error: string | null;
}

export function useProfileDetail(
  routePrefix: RoutePrefix,
  legacyId: string | number | undefined
): UseProfileDetailResult {
  const [profile, setProfile] = useState<AIProfileDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!legacyId) {
      setProfile(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchProfile() {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/ai-profiles/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            profileId: `${routePrefix}-${legacyId}`,
          }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Profile not found");
        }

        const payload = await response.json();
        if (!cancelled) {
          setProfile(payload.data);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message ?? "Unable to fetch profile");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [routePrefix, legacyId]);

  return { profile, loading, error };
}


