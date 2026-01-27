import { RoutePrefix } from '@/types/ai-profile';

/**
 * Creates a URL-friendly slug from text
 * Example: "Hinata – The Shy AI Girlfriend" becomes "Hinata-The-Shy-AI-Girlfriend"
 */
export function slugify(text: string): string {
    return text
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with dashes
        .replace(/[^\w\-–—]+/g, '')     // Remove special chars except dashes and en/em dashes
        .replace(/\-\-+/g, '-')         // Replace multiple dashes with single dash
        .replace(/^-+/, '')             // Trim dashes from start
        .replace(/-+$/, '');            // Trim dashes from end
}

/**
 * Generates an SEO-friendly profile URL
 * Format: /{routePrefix}/{name}-{cardTitle}-{legacyId}
 * Example: /girl/Hinata-The-Shy-AI-Girlfriend-424
 */
export function getProfileRoute(
    routePrefix: RoutePrefix,
    name: string,
    cardTitle: string,
    legacyId: number | string | null
): string {
    const nameSlug = slugify(name);
    const titleSlug = slugify(cardTitle);
    return `/${routePrefix}/${nameSlug}-${titleSlug}-${legacyId}`;
}

/**
 * Extracts the legacy ID from a profile URL slug
 * Example: "Hinata-The-Shy-AI-Girlfriend-424" returns "424"
 * Example: "My-Char-69789009e1da83ed124d3ab5" returns "69789009e1da83ed124d3ab5"
 */
export function extractLegacyIdFromSlug(slug: string): string | null {
    // The ID is always after the last dash
    const parts = slug.split('-');
    const lastPart = parts[parts.length - 1];

    // Check if it's a valid number OR a valid MongoDB ObjectId (24 hex chars)
    if (/^\d+$/.test(lastPart) || /^[0-9a-fA-F]{24}$/.test(lastPart)) {
        return lastPart;
    }

    return null;
}
