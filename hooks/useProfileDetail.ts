"use client";

import { useEffect, useState } from "react";
import type { AIProfileDetail, RoutePrefix } from "@/types/ai-profile";
import { getProfilePreview } from "@/lib/profile-preview-cache";

interface UseProfileDetailResult {
  profile: AIProfileDetail | null;
  loading: boolean;
  error: string | null;
}

// In-memory cache for full profile data
const profileCache = new Map<string, { data: AIProfileDetail; timestamp: number }>();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Export cache invalidation function so pages can clear stale data after actions
export function invalidateProfileCache(profileId: string) {
  profileCache.delete(profileId);
}

export function useProfileDetail(
  routePrefix: RoutePrefix,
  legacyId: string | number | undefined
): UseProfileDetailResult {
  const cacheKey = legacyId ? `${routePrefix}-${legacyId}` : null;

  // --- Instant preview from card data ---
  // If the user clicked a card we already have name/avatar/age/stats in the
  // preview cache. Use those as the initial state so the page renders
  // immediately while the full fetch runs in the background.
  const preview = cacheKey ? getProfilePreview(cacheKey) : null;

  // --- Full profile cache hit ---
  const fullCached = cacheKey ? profileCache.get(cacheKey) : undefined;
  const hasFreshCache =
    fullCached !== undefined && Date.now() - fullCached.timestamp < CACHE_DURATION;

  // Use state to hold the fetched profile, but we will augment it during render
  const [fetchedProfile, setFetchedProfile] = useState<AIProfileDetail | null>(
    () => fullCached?.data ?? null
  );
  
  // We compute the "current" profile synchronously so it never flashes null when cacheKey changes
  const profile = fetchedProfile ?? fullCached?.data ?? (preview as any) ?? null;

  // We compute loading synchronously based on whether we have any profile data to show
  const [isFetching, setIsFetching] = useState(false);
  const loading = isFetching && !profile;

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!legacyId || !cacheKey) {
      setFetchedProfile(null);
      setIsFetching(false);
      return;
    }

    // Full cache hit — no fetch needed
    if (hasFreshCache) {
      setFetchedProfile(fullCached!.data);
      setIsFetching(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchProfile() {
      setIsFetching(true);
      setError(null);

      try {
        const response = await fetch("/api/ai-profiles/public", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ profileId: cacheKey }),
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error("Profile not found");
        }

        const payload = await response.json();
        if (!cancelled) {
          setFetchedProfile(payload.data);
          // Cache all profile types (characters included) — invalidate explicitly on mutation
          profileCache.set(cacheKey!, {
            data: payload.data,
            timestamp: Date.now(),
          });
        }
      } catch (err: any) {
        if (!cancelled && err.name !== "AbortError") {
          setError(err?.message ?? "Unable to fetch profile");
        }
      } finally {
        if (!cancelled) {
          setIsFetching(false);
        }
      }
    }

    fetchProfile();

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cacheKey]);

  return { profile, loading, error };
}
