"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { GoogleLogin } from "@react-oauth/google";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    try {
      setLoading(true);
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: credentialResponse.credential }),
      });
      const data = await res.json();
      if (data.success) {
        // We need to manually store token and user since useAuth.login does it internally for email/pass
        // Ideally we should expose a 'googleLogin' method in AuthContext, or just hack it here by setting localStorage and forcing reload/redirect
        // But better: call a method from AuthContext if possible, or just replicate what login does.
        // Let's assume we can just redirect and the AuthContext will pick up the token from localStorage if we set it.
        // Actually, looking at AuthContext would be good. 
        // For now, let's set localStorage and redirect. "login" function in AuthContext usually sets state.
        
        // BETTER APPROACH: Add loginWithGoogle to AuthContext? 
        // Or just reload the page/window.location.href to let AuthContext initialize with new token.
        
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.data.user));
        
        // Trigger a custom event or just redirect
        window.location.href = "/dashboard"; 
      } else {
        setMessage(data.message || "Google Login failed");
      }
    } catch (err: any) {
        setMessage(err.message || "Google Login failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleError = () => {
    setMessage("Google Login Failed");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      await login(email, password);
      // AuthContext.login will handle redirect to /dashboard
    } catch (err: any) {
      setMessage(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            💖 Welcome Back
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">Sign in to continue chatting with your AI girlfriends.</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-white/15 bg-zinc-900/70 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              placeholder="john@example.com"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-300 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-white/15 bg-zinc-900/70 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
              placeholder="••••••••"
              required
            />
          </div>

          {message && (
            <div
              className={`p-3 rounded-lg text-sm ${
                message.includes("success")
                  ? "bg-green-500/10 text-green-400 border border-green-500/40"
                  : "bg-red-500/10 text-red-400 border border-red-500/40"
              }`}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                    fill="none"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Signing In...
              </span>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div className="mt-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/10"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-zinc-900 text-zinc-400">Or continue with</span>
            </div>
          </div>

          <div className="mt-6 flex justify-center">
             <GoogleLogin
                onSuccess={handleGoogleSuccess}
                onError={handleGoogleError}
                theme="filled_black"
                shape="circle"
                width="100%"
             />
          </div>
        </div>

        <p className="text-center mt-6 text-sm text-zinc-400">
          Don't have an account?{" "}
          <Link
            href="/register"
            className="text-pink-400 hover:text-pink-300 font-semibold"
          >
            Create Account
          </Link>
        </p>
      </div>
    </main>
  );
}
