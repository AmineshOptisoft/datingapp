"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import { Users, Bot, Film, Gift, TrendingUp, ArrowUpRight } from "lucide-react";
import Link from "next/link";

interface Stats {
  totalUsers: number;
  totalCharacters: number;
  totalReels: number;
  totalGifts: number;
  recentUsers: number;
}

export default function AdminDashboard() {
  const { token } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === "dark";
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch("/api/admin/stats", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setStats(data.stats);
        }
      } catch (err) {
        console.error("Failed to fetch admin stats:", err);
      } finally {
        setLoading(false);
      }
    };

    if (token) fetchStats();
  }, [token]);

  const statCards = [
    {
      label: "Total Users",
      value: stats?.totalUsers || 0,
      icon: Users,
      gradient: "from-blue-500 to-cyan-400",
      bgGlow: isDark ? "bg-blue-500/10" : "bg-blue-50",
      href: "/admin/users",
    },
    {
      label: "Characters",
      value: stats?.totalCharacters || 0,
      icon: Bot,
      gradient: "from-pink-500 to-rose-400",
      bgGlow: isDark ? "bg-pink-500/10" : "bg-pink-50",
      href: "/admin/characters",
    },
    {
      label: "Total Reels",
      value: stats?.totalReels || 0,
      icon: Film,
      gradient: "from-purple-500 to-violet-400",
      bgGlow: isDark ? "bg-purple-500/10" : "bg-purple-50",
      href: "#",
    },
    {
      label: "Total Gifts",
      value: stats?.totalGifts || 0,
      icon: Gift,
      gradient: "from-amber-500 to-yellow-400",
      bgGlow: isDark ? "bg-amber-500/10" : "bg-amber-50",
      href: "/admin/gifts",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Banner */}
      <div className={`relative overflow-hidden rounded-2xl border p-8 ${
        isDark 
          ? 'bg-gradient-to-r from-pink-500/20 via-purple-500/20 to-blue-500/20 border-white/10' 
          : 'bg-gradient-to-r from-pink-500/10 via-purple-500/10 to-blue-500/10 border-gray-200'
      }`}>
        <div className="relative">
          <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>Welcome back, Admin 👋</h1>
          <p className={`text-lg ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>Here's what's happening with your platform today.</p>
          {stats && (
            <div className="flex items-center gap-2 mt-4 text-sm">
              <TrendingUp className="w-4 h-4 text-green-500" />
              <span className="text-green-500 font-medium">{stats.recentUsers} new users</span>
              <span className={isDark ? 'text-zinc-500' : 'text-gray-400'}>in the last 7 days</span>
            </div>
          )}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`group relative overflow-hidden rounded-2xl border p-6 transition-all duration-300 hover:scale-[1.02] ${
              isDark 
                ? `${card.bgGlow} border-white/10 hover:border-white/20` 
                : `${card.bgGlow} border-gray-200 hover:border-gray-300 hover:shadow-lg`
            }`}
          >
            {/* Background gradient glow */}
            <div className={`absolute -top-12 -right-12 w-32 h-32 rounded-full bg-gradient-to-br ${card.gradient} opacity-20 blur-2xl group-hover:opacity-30 transition-opacity`} />

            <div className="relative">
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-4 shadow-lg`}>
                <card.icon className="w-6 h-6 text-white" />
              </div>
              <p className={`text-sm font-medium mb-1 ${isDark ? 'text-zinc-400' : 'text-gray-500'}`}>{card.label}</p>
              <div className="flex items-end justify-between">
                <span className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {loading ? (
                    <span className={`inline-block w-12 h-8 rounded animate-pulse ${isDark ? 'bg-white/10' : 'bg-gray-200'}`} />
                  ) : (
                    card.value.toLocaleString()
                  )}
                </span>
                <ArrowUpRight className={`w-5 h-5 transition-colors ${isDark ? 'text-zinc-500 group-hover:text-white' : 'text-gray-400 group-hover:text-gray-900'}`} />
              </div>
            </div>
          </Link>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link
          href="/admin/users"
          className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-md'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
            <Users className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Manage Profiles</p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>View, edit & create user profiles</p>
          </div>
          <ArrowUpRight className={`w-5 h-5 ml-auto transition-colors ${isDark ? 'text-zinc-600 group-hover:text-white' : 'text-gray-300 group-hover:text-gray-900'}`} />
        </Link>

        <Link
          href="/admin/characters"
          className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-md'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-pink-500/20' : 'bg-pink-100'}`}>
            <Bot className="w-5 h-5 text-pink-500" />
          </div>
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Character List</p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>Edit characters & create reels</p>
          </div>
          <ArrowUpRight className={`w-5 h-5 ml-auto transition-colors ${isDark ? 'text-zinc-600 group-hover:text-white' : 'text-gray-300 group-hover:text-gray-900'}`} />
        </Link>

        <Link
          href="/admin/gifts"
          className={`flex items-center gap-4 p-5 rounded-2xl border transition-all group ${
            isDark ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-white border-gray-200 hover:shadow-md'
          }`}
        >
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
            <Gift className="w-5 h-5 text-amber-500" />
          </div>
          <div>
            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>Gift Transactions</p>
            <p className={`text-sm ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>View all gift activity</p>
          </div>
          <ArrowUpRight className={`w-5 h-5 ml-auto transition-colors ${isDark ? 'text-zinc-600 group-hover:text-white' : 'text-gray-300 group-hover:text-gray-900'}`} />
        </Link>
      </div>
    </div>
  );
}
