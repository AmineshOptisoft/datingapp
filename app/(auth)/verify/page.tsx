"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const email = searchParams.get("email") || "";
  const phone = searchParams.get("phone") || "";
  const userId = searchParams.get("userId") || "";

  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);

  useEffect(() => {
    if (verified) {
      setTimeout(() => {
        router.push("/login");
      }, 2000);
    }
  }, [verified, router]);

  const handleVerify = async () => {
    if (otp.length !== 6) {
      setMessage("Please enter a 6-digit OTP");
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, otp }),
      });
      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setVerified(true);
      }
    } catch {
      setMessage("Verification failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setMessage("");
    setResendLoading(true);

    try {
      const response = await fetch("/api/auth/resendotp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      const data = await response.json();

      setMessage(
        response.ok
          ? "New OTP sent to your email and phone!"
          : data.message || "Failed to resend OTP"
      );
    } catch {
      setMessage("Network error while resending OTP");
    } finally {
      setResendLoading(false);
    }
  };


  return (
    <main className="min-h-screen flex items-center justify-center px-4 md:px-8">
      <div className="bg-zinc-900/70 border border-white/10 p-6 md:p-8 rounded-2xl shadow-2xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🔐</div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-2">
            Verify Your Account
          </h1>
          <p className="text-zinc-400 text-sm md:text-base">
            Enter the OTP sent to your email or phone.
          </p>
        </div>

        {!verified ? (
          <>
            <div className="bg-zinc-900/80 rounded-xl p-4 mb-6 space-y-2 border border-white/10">
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <span className="text-purple-400">📧</span>
                <span>{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-zinc-300">
                <span className="text-purple-400">📱</span>
                <span>{phone}</span>
              </div>
            </div>

            <div className="bg-zinc-900/80 border border-purple-500/40 rounded-lg p-4 mb-6">
              <p className="text-sm text-zinc-200 flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span>
                  <strong>Use either channel:</strong> The same OTP has been
                  sent to both your email and phone. You can use the code from
                  either source to verify your account.
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                value={otp}
                onChange={(e) =>
                  setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))
                }
                onKeyPress={(e) => {
                  if (e.key === "Enter" && otp.length === 6) {
                    handleVerify();
                  }
                }}
                className="w-full px-4 py-3 border border-white/15 bg-zinc-900/70 rounded-lg text-center text-2xl font-mono tracking-[1em] text-zinc-100 placeholder-zinc-600 focus:ring-2 focus:ring-pink-500 focus:border-transparent outline-none"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  message.includes("success") || message.includes("sent")
                    ? "bg-green-500/10 text-green-400 border border-green-500/40"
                    : "bg-red-500/10 text-red-400 border border-red-500/40"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-full font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4 shadow-lg"
            >
              {loading ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 mr-2"
                    viewBox="0 0 24 24"
                  >
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
                  Verifying...
                </span>
              ) : (
                "Verify Account"
              )}
            </button>

            <div className="text-center">
              <button
                onClick={handleResend}
                disabled={resendLoading}
                className="text-pink-400 hover:text-pink-300 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading
                  ? "Resending..."
                  : "Didn't receive the code? Resend OTP"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-500/15 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">
              Account Verified! ✅
            </h2>
            <p className="text-zinc-300 mb-4">
              Both your email and phone have been verified successfully.
            </p>
            <p className="text-sm text-zinc-500">Redirecting to login...</p>
          </div>
        )}
      </div>
    </main>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </main>
    }>
      <VerifyContent />
    </Suspense>
  );
}

