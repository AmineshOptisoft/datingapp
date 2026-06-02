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

  const [profile, setProfile] = useState<AIProfileDetail | null>(
    () => fullCached?.data ?? (preview as any) ?? null
  );
  // Only show loading state if we have neither a full cache hit nor a preview
  const [loading, setLoading] = useState(() => !hasFreshCache && !preview);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!legacyId || !cacheKey) {
      setProfile(null);
      setLoading(false);
      return;
    }

    // Full cache hit — no fetch needed
    if (hasFreshCache) {
      setProfile(fullCached!.data);
      setLoading(false);
      return;
    }

    let cancelled = false;
    const controller = new AbortController();

    async function fetchProfile() {
      // If we have a preview, don't show the loading skeleton — let the UI
      // render with partial data while the full fetch completes in background.
      if (!preview) {
        setLoading(true);
      }
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
          setProfile(payload.data);
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
          setLoading(false);
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
