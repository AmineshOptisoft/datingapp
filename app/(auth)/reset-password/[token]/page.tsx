
"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage("");
    
    if (password !== confirmPassword) {
      setMessage("Passwords do not match");
      return;
    }
    
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });

      const data = await res.json();

      if (res.ok) {
        setSuccess(true);
        setMessage("Password reset successfully! Redirecting to login...");
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } else {
        setMessage(data.message || "Failed to reset password");
      }
    } catch (err: any) {
      setMessage("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-4 md:px-8">
      <div className="w-full max-w-md bg-zinc-900/70 border border-white/10 rounded-2xl shadow-2xl p-6 md:p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            Reset Password
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">Enter your new password below.</p>
        </div>

        {success ? (
          <div className="text-center">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
               <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
               </svg>
            </div>
            <p className="text-green-400 font-medium mb-4">{message}</p>
            <Link href="/login" className="text-pink-400 hover:text-pink-300 font-semibold">
              Go to Login
            </Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                New Password
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
            
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Confirm Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-3 border border-white/15 bg-zinc-900/70 rounded-lg text-zinc-100 placeholder-zinc-500 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none transition"
                placeholder="••••••••"
                required
              />
            </div>

            {message && (
              <div className="p-3 bg-red-500/10 text-red-400 border border-red-500/40 rounded-lg text-sm">
                {message}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-lg"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
            
             <p className="text-center mt-4 text-sm text-zinc-400">
              <Link href="/login" className="text-zinc-500 hover:text-zinc-300">
                Back to Login
              </Link>
            </p>
          </form>
        )}
      </div>
    </main>
  );
}
