/**
 * Profile Preview Cache
 *
 * Stores the lightweight card data (name, avatar, age, stats) in a module-level
 * Map before the user navigates to a profile page.
 *
 * The profile page reads from this cache to render instantly — before the full
 * API response arrives — eliminating the blank/skeleton flash on navigation.
 *
 * Resets on hard reload; persists across client-side navigation (Next.js keeps
 * modules alive between pages).
 */

export interface ProfilePreview {
  _id?: string;
  name: string;
  avatar: string;
  cardTitle?: string;
  personalityType?: string;
  age?: number | null;
  likes?: number;
  interactions?: number;
  routePrefix?: string;
  monthlyPrice?: number;
  audienceSegment?: string;
}

const previewCache = new Map<string, ProfilePreview>();

/** Call this in GirlCard (or any card) right before navigating to the profile page. */
export function setProfilePreview(cacheKey: string, data: ProfilePreview): void {
  previewCache.set(cacheKey, data);
}

/** Returns the cached preview data, or null if not available. */
export function getProfilePreview(cacheKey: string): ProfilePreview | null {
  return previewCache.get(cacheKey) ?? null;
}

/** Removes a preview entry (useful after full profile is loaded). */
export function clearProfilePreview(cacheKey: string): void {
  previewCache.delete(cacheKey);
}
