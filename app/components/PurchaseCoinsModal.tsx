"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { PiCoinsFill } from "react-icons/pi";
import { toast } from "sonner";

interface PurchaseCoinsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const COIN_PACKAGES = [
  {
    id: "starter",
    name: "Starter",
    coins: 300,
    price: 10,
    popular: false,
    description: "Get started with AI art",
  },
  {
    id: "popular",
    name: "Popular",
    coins: 840,
    price: 25,
    popular: true,
    description: "Our most popular plan + 40% more coins",
    badge: "BEST VALUE",
  },
  {
    id: "premium",
    name: "Premium",
    coins: 2000,
    price: 50,
    popular: false,
    description: "Premium plan with extra coins",
    badge: "LIFETIME",
  },
];

export default function PurchaseCoinsModal({
  isOpen,
  onClose,
  onSuccess,
}: PurchaseCoinsModalProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setIsProcessing(true);
    setSelectedPackage(packageId);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        toast.error("Please login to purchase coins");
        return;
      }

      // Call Stripe checkout API
      const response = await fetch("/api/wallet/purchase", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ packageId }),
      });

      const data = await response.json();

      if (response.ok && data.checkoutUrl) {
        // Redirect to Stripe checkout
        window.location.href = data.checkoutUrl;
      } else {
        toast.error(data.error || "Failed to initiate payment");
      }
    } catch (error) {
      console.error("Purchase error:", error);
      toast.error("Failed to process purchase");
    } finally {
      setIsProcessing(false);
      setSelectedPackage(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-900 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
        {/* Header */}
        <div className="relative p-6 border-b border-zinc-200 dark:border-zinc-800">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5 text-zinc-500" />
          </button>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-white">
            Purchase Coins
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Choose a package to get started with AI art generation
          </p>
        </div>

        {/* Packages */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
          {COIN_PACKAGES.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative p-5 rounded-xl border-2 transition-all hover:scale-105 cursor-pointer ${
                pkg.popular
                  ? "border-purple-500 bg-purple-50 dark:bg-purple-900/20"
                  : "border-zinc-200 dark:border-zinc-700 hover:border-zinc-300 dark:hover:border-zinc-600"
              }`}
              onClick={() => !isProcessing && handlePurchase(pkg.id)}
            >
              {/* Badge */}
              {pkg.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                  <span className="text-xs font-bold text-white">
                    {pkg.badge}
                  </span>
                </div>
              )}

              {/* Package Info */}
              <div className="text-center space-y-3">
                <h3 className="text-lg font-bold text-zinc-900 dark:text-white">
                  {pkg.name}
                </h3>

                {/* Coins */}
                <div className="flex items-center justify-center gap-2">
                  <PiCoinsFill className="w-6 h-6 text-yellow-500" />
                  <span className="text-3xl font-bold text-zinc-900 dark:text-white">
                    +{pkg.coins}
                  </span>
                </div>

                {/* Description */}
                <p className="text-xs text-zinc-600 dark:text-zinc-400 min-h-[2.5rem]">
                  {pkg.description}
                </p>

                {/* Price Button */}
                <button
                  disabled={isProcessing}
                  className={`w-full py-2.5 rounded-lg font-semibold transition-all ${
                    pkg.popular
                      ? "bg-purple-600 hover:bg-purple-700 text-white"
                      : "bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 hover:opacity-90"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isProcessing && selectedPackage === pkg.id ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Processing...
                    </span>
                  ) : (
                    `Buy for $${pkg.price}`
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800">
          <p className="text-xs text-center text-zinc-500 dark:text-zinc-400">
            Secure payment powered by Stripe • All packages are one-time purchases
          </p>
        </div>
      </div>
    </div>
  );
}
