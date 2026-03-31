"use client";

import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
  Gift,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
  Coins,
} from "lucide-react";

interface GiftData {
  _id: string;
  sender: string;
  receiver: string;
  giftId: number;
  giftName: string;
  price: number;
  createdAt: string;
  senderInfo: { name: string; email: string; avatar: string | null };
  receiverInfo: { name: string; email: string; avatar: string | null };
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

// Gift emoji mapping based on common gift IDs
const GIFT_EMOJIS: Record<number, string> = {
  1: "🌹",
  2: "💎",
  3: "🧸",
  4: "🍫",
  5: "💐",
  6: "🎁",
  7: "💍",
  8: "🥂",
  9: "🎂",
  10: "❤️",
};

export default function AdminGiftsPage() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [gifts, setGifts] = useState<GiftData[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });
  const [loading, setLoading] = useState(true);
  const [totalValue, setTotalValue] = useState(0);

  const fetchGifts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/gifts?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setGifts(data.gifts);
        setPagination(data.pagination);
        // Calculate total value from visible gifts
        const sum = data.gifts.reduce((acc: number, g: GiftData) => acc + (g.price || 0), 0);
        setTotalValue(sum);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) fetchGifts();
  }, [token, fetchGifts]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>Gift Transactions</h1>
          <p className={`text-sm mt-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{pagination.total} total transactions</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <Coins className="w-4 h-4 text-amber-400" />
            <span className="text-amber-400 font-semibold text-sm">{totalValue} coins</span>
            <span className="text-zinc-500 text-xs">on this page</span>
          </div>
        </div>
      </div>

      {/* Gifts Table */}
      <div className={`rounded-2xl border overflow-hidden ${isDark ? 'border-white/10 bg-white/[0.02]' : 'border-gray-200 bg-white'}`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Gift</th>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Sender</th>
                <th className={`text-center px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}></th>
                <th className={`text-left px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Receiver</th>
                <th className={`text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Price</th>
                <th className={`text-right px-6 py-4 text-xs font-semibold uppercase tracking-wider hidden sm:table-cell ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Date</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-gray-100'}`}>
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={6} className="px-6 py-4">
                      <div className="h-10 bg-white/5 rounded-lg animate-pulse" />
                    </td>
                  </tr>
                ))
              ) : gifts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-16 text-center">
                    <Gift className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
                    <p className="text-zinc-500">No gift transactions yet</p>
                  </td>
                </tr>
              ) : (
                gifts.map((gift) => (
                  <tr key={gift._id} className={`transition-colors ${isDark ? 'hover:bg-white/[0.03]' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{GIFT_EMOJIS[gift.giftId] || "🎁"}</span>
                        <span className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{gift.giftName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {gift.senderInfo?.avatar ? (
                          <img src={gift.senderInfo.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-blue-500/20 flex items-center justify-center text-[10px] text-blue-400 font-bold">
                            {(gift.senderInfo?.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-zinc-300 text-sm truncate max-w-[120px]">{gift.senderInfo?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-3 py-4 text-center">
                      <ArrowRight className="w-4 h-4 text-zinc-600 mx-auto" />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {gift.receiverInfo?.avatar ? (
                          <img src={gift.receiverInfo.avatar} alt="" className="w-7 h-7 rounded-full object-cover" />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-pink-500/20 flex items-center justify-center text-[10px] text-pink-400 font-bold">
                            {(gift.receiverInfo?.name || "?").charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-zinc-300 text-sm truncate max-w-[120px]">{gift.receiverInfo?.name || "Unknown"}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 text-amber-400 font-semibold text-sm">
                        <Coins className="w-3.5 h-3.5" />
                        {gift.price}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right text-zinc-500 text-sm hidden sm:table-cell">
                      {new Date(gift.createdAt).toLocaleDateString("en-US", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-white/10">
            <p className="text-zinc-500 text-sm">
              Page {pagination.page} of {pagination.totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => fetchGifts(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => fetchGifts(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="p-2 rounded-lg border border-white/10 text-zinc-400 hover:text-white hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
