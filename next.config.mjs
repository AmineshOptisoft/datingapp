/** @type {import('next').NextConfig} */
const nextConfig = {
  // reactStrictMode: false, // Disable to prevent double API calls in development
  /**
   * This app relies on server capabilities (cookies/headers, DB, auth, sockets).
   * Pin the build output to an SSR-friendly mode so platforms don't attempt a
   * static export during `next build`.
   */
  output: "standalone",
};

export default nextConfig;
