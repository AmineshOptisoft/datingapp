"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

export default function VerifyPage() {
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-pink-100 to-purple-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-6xl mb-4">🔐</div>
          <h1 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-pink-500 to-purple-600 mb-2">
            Verify Your Account
          </h1>
          <p className="text-gray-600">
            Enter the OTP sent to your email or phone
          </p>
        </div>

        {!verified ? (
          <>
            <div className="bg-purple-50 rounded-xl p-4 mb-6 space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-purple-600">📧</span>
                <span className="text-gray-700">{email}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-purple-600">📱</span>
                <span className="text-gray-700">{phone}</span>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="text-sm text-blue-800 flex items-start gap-2">
                <span className="text-xl">💡</span>
                <span>
                  <strong>Use either channel:</strong> The same OTP has been
                  sent to both your email and phone. You can use the code from
                  either source to verify your account.
                </span>
              </p>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl font-mono tracking-[1em] focus:ring-2 focus:ring-purple-500 focus:border-transparent outline-none"
                placeholder="000000"
                maxLength={6}
              />
            </div>

            {message && (
              <div
                className={`p-3 rounded-lg text-sm mb-4 ${
                  message.includes("success") || message.includes("sent")
                    ? "bg-green-50 text-green-700 border border-green-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {message}
              </div>
            )}

            <button
              onClick={handleVerify}
              disabled={loading || otp.length !== 6}
              className="w-full bg-gradient-to-r from-pink-500 to-purple-600 text-white py-3 rounded-lg font-semibold hover:from-pink-600 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition mb-4"
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
                className="text-purple-600 hover:text-purple-700 font-semibold text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resendLoading
                  ? "Resending..."
                  : "Didn't receive the code? Resend OTP"}
              </button>
            </div>
          </>
        ) : (
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg
                className="w-10 h-10 text-green-600"
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
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Account Verified! ✅
            </h2>
            <p className="text-gray-600 mb-4">
              Both your email and phone have been verified successfully.
            </p>
            <p className="text-sm text-gray-500">Redirecting to login...</p>
          </div>
        )}
      </div>
    </div>
  );
}
