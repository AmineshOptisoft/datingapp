"use client";

import { useEffect, useState } from "react";
import { AIProfileOverview, AudienceSegment } from "@/types/ai-profile";

interface UseProfilesResult {
  profiles: AIProfileOverview[];
  loading: boolean;
  error: string | null;
}

/**
 * Module-level cache — persists across client-side navigation, resets on hard reload.
 * Key: segment string (or "" for all profiles).
 */
const profileCache = new Map<string, AIProfileOverview[]>();
/** Tracks in-flight fetches so duplicate mounts don't fire two requests. */
const inFlight = new Map<string, Promise<AIProfileOverview[]>>();

async function fetchProfilesFromAPI(segment?: string | null): Promise<AIProfileOverview[]> {
  const url = segment
    ? `/api/ai-profiles/public?segment=${segment}`
    : `/api/ai-profiles/public`;

  const headers: HeadersInit = {};
  const token = typeof window !== "undefined" ? localStorage.getItem("token") : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const response = await fetch(url, { headers });
  if (!response.ok) throw new Error("Failed to load profiles");
  const payload = await response.json();
  return payload.data || [];
}

export function useProfiles(segment?: string | null): UseProfilesResult {
  const cacheKey = segment ?? "";

  // If already cached, start with the data immediately — no loading flash.
  const [profiles, setProfiles] = useState<AIProfileOverview[]>(
    () => profileCache.get(cacheKey) ?? []
  );
  const [loading, setLoading] = useState(() => !profileCache.has(cacheKey));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Cache hit — data already in state, nothing to fetch.
    if (profileCache.has(cacheKey)) return;

    let cancelled = false;

    // Reuse an in-flight request if one is already running for this key.
    const request =
      inFlight.get(cacheKey) ??
      (() => {
        const p = fetchProfilesFromAPI(segment).finally(() => inFlight.delete(cacheKey));
        inFlight.set(cacheKey, p);
        return p;
      })();

    setLoading(true);
    setError(null);

    request
      .then((data) => {
        if (cancelled) return;
        profileCache.set(cacheKey, data);
        setProfiles(data);
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.message ?? "Unable to fetch profiles");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [cacheKey]);

  return { profiles, loading, error };
}
