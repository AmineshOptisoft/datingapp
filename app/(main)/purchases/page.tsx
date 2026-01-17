"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/contexts/AuthContext";
import Link from "next/link";
import { getProfileRoute } from "@/lib/url-helpers";

interface Purchase {
  aiProfileId: any;
  planType: string;
  status: string;
  subscriptionId: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
  purchasedAt: string;
}

// Helper function to generate profile URL using the same logic as the rest of the app
const getProfileUrl = (aiProfile: any) => {
  if (!aiProfile || !aiProfile.name || !aiProfile.cardTitle || !aiProfile.legacyId) {
    console.warn('Missing required fields for profile URL:', aiProfile);
    return "/";
  }
  
  const routePrefix = aiProfile.routePrefix || "girl";
  return getProfileRoute(routePrefix, aiProfile.name, aiProfile.cardTitle, aiProfile.legacyId);
};

export default function PurchasesPage() {
  const router = useRouter();
  const { user, token } = useAuth();
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push("/");
      return;
    }

    fetchPurchases();
  }, [token, router]);

  const fetchPurchases = async () => {
    try {
      const res = await fetch("/api/stripe/user-purchases", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();

      if (data.success) {
        console.log('📦 Purchases API response:', data.purchases);
        if (data.purchases.length > 0) {
          console.log('🔍 First purchase AI profile:', data.purchases[0].aiProfileId);
        }
        setPurchases(data.purchases || []);
      }
    } catch (error) {
      console.error("Error fetching purchases:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-zinc-950 flex items-center justify-center">
        <div className="text-zinc-600 dark:text-zinc-400">Loading...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-white dark:bg-zinc-950 px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-zinc-900 dark:text-white mb-2">
            My Purchases
          </h1>
          <div className="w-16 h-1 bg-gradient-to-r from-pink-500 to-purple-600 mx-auto rounded-full mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">
            Welcome, {user?.name || "User"}!
          </p>
        </div>

        {/* Empty State or Purchase List */}
        {purchases.length === 0 ? (
          <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            {/* Shopping Cart Icon */}
            <div className="inline-block mb-6">
              <svg
                className="w-20 h-20 text-zinc-400 dark:text-zinc-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            </div>

            <h2 className="text-xl font-semibold text-zinc-800 dark:text-zinc-200 mb-2">
              No purchases yet
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Your purchased companions will appear here once you make a purchase.
            </p>

            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
              </svg>
              Browse Companions
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase, index) => (
              <div
                key={index}
                className="bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 hover:border-pink-500/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  {/* AI Profile Image */}
                  <div className="w-20 h-20 rounded-lg overflow-hidden bg-gradient-to-br from-pink-500 to-purple-600 flex-shrink-0">
                    {purchase.aiProfileId?.images?.[0] ? (
                      <img
                        src={purchase.aiProfileId.images[0]}
                        alt={purchase.aiProfileId.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-2xl">
                        💖
                      </div>
                    )}
                  </div>

                  {/* Purchase Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-zinc-900 dark:text-white mb-1">
                      {purchase.aiProfileId?.name || "AI Companion"}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-3">
                      {purchase.aiProfileId?.tagline || "Your AI companion"}
                    </p>

                    <div className="flex flex-wrap gap-4 text-sm">
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Plan:</span>
                        <span className="ml-1 font-medium text-zinc-900 dark:text-white capitalize">
                          {purchase.planType}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Status:</span>
                        <span
                          className={`ml-1 font-medium ${
                            purchase.status === "active"
                              ? "text-green-600 dark:text-green-400"
                              : "text-zinc-600 dark:text-zinc-400"
                          }`}
                        >
                          {purchase.status}
                        </span>
                      </div>
                      <div>
                        <span className="text-zinc-500 dark:text-zinc-400">Purchased:</span>
                        <span className="ml-1 font-medium text-zinc-900 dark:text-white">
                          {new Date(purchase.purchasedAt).toLocaleDateString()}
                        </span>
                      </div>
                      {purchase.currentPeriodEnd && (
                        <div>
                          <span className="text-zinc-500 dark:text-zinc-400">Renews:</span>
                          <span className="ml-1 font-medium text-zinc-900 dark:text-white">
                            {new Date(purchase.currentPeriodEnd).toLocaleDateString()}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={getProfileUrl(purchase.aiProfileId)}
                    className="px-4 py-2 bg-gradient-to-r from-pink-500 to-purple-600 hover:from-pink-600 hover:to-purple-700 text-white text-sm font-medium rounded-lg transition-all"
                  >
                    View Profile
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
