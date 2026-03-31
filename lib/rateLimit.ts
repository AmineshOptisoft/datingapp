// A centralized, in-memory rate limiter for different parts of the application

export class RateLimiter {
  private requests: Map<string, number[]>;
  private limit: number;
  private windowTimeMs: number;

  constructor(limit: number, windowTimeMs: number = 60 * 1000) {
    this.requests = new Map<string, number[]>();
    this.limit = limit;
    this.windowTimeMs = windowTimeMs;
  }

  /**
   * Checks if the rate limit has been exceeded for a given identifier (e.g., userId).
   * @param key Identifying key (e.g., userId)
   * @returns boolean true if the request is allowed, false if limit is exceeded
   */
  public isAllowed(key: string): boolean {
    const now = Date.now();
    let userTrack = this.requests.get(key) || [];

    // Clean up older requests outside the time window to prevent memory leaks
    userTrack = userTrack.filter((timestamp) => now - timestamp < this.windowTimeMs);

    if (userTrack.length >= this.limit) {
      // Limit exceeded, keep the array updated but don't add the new hit
      this.requests.set(key, userTrack);
      return false;
    }

    // Add current request
    userTrack.push(now);
    this.requests.set(key, userTrack);
    return true;
  }

  /**
   * Get the number of remaining requests for a key within the current window.
   */
  public getRemaining(key: string): number {
    const now = Date.now();
    let userTrack = this.requests.get(key) || [];
    userTrack = userTrack.filter((timestamp) => now - timestamp < this.windowTimeMs);
    return Math.max(0, this.limit - userTrack.length);
  }
}

// Export pre-configured limiters for different resources
export const imageGenerationLimiter = new RateLimiter(5, 60 * 1000); // 5 images per minute
export const videoGenerationLimiter = new RateLimiter(3, 60 * 1000); // 3 videos per minute
export const chatMessageLimiter = new RateLimiter(20, 60 * 1000);     // 20 messages per minute
