"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/app/contexts/AuthContext";
import { useTheme } from "@/app/contexts/ThemeContext";
import {
  LayoutDashboard,
  Users,
  Bot,
  Gift,
  LogOut,
  Shield,
  ChevronRight,
  Sun,
  Moon,
  ArrowLeft,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/users", label: "Profiles", icon: Users },
  { href: "/admin/characters", label: "Character List", icon: Bot },
  { href: "/admin/gifts", label: "Gifts", icon: Gift },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isAdmin, logout, loading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname();

  const isDark = theme === "dark";

  useEffect(() => {
    if (!loading && (!isAuthenticated || !isAdmin)) {
      router.push("/");
    }
  }, [loading, isAuthenticated, isAdmin, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-10 h-10 border-4 border-pink-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return null;
  }

  return (
    <div className="flex h-full overflow-hidden">
      {/* Sidebar - integrated into main layout */}
      <aside
        className={`hidden md:flex flex-col w-56 flex-shrink-0 border-r h-full ${
          isDark 
            ? 'bg-[#111111]/80 border-white/10' 
            : 'bg-white/80 border-gray-200'
        }`}
      >
        {/* Logo */}
        <div className={`flex-shrink-0 flex items-center gap-3 px-5 py-4 border-b ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center shadow-lg shadow-pink-500/20">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className={`font-bold text-sm leading-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>Admin Panel</h1>
            <p className={`text-[10px] ${isDark ? 'text-zinc-500' : 'text-gray-400'}`}>IDYLL</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group ${
                  isActive
                    ? isDark
                      ? "bg-gradient-to-r from-pink-500/20 to-purple-600/20 text-pink-400 border border-pink-500/30"
                      : "bg-gradient-to-r from-pink-500/10 to-purple-600/10 text-pink-600 border border-pink-500/20"
                    : isDark
                      ? "text-zinc-400 hover:text-white hover:bg-white/5"
                      : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                }`}
              >
                <item.icon className={`w-4 h-4 ${
                  isActive 
                    ? isDark ? "text-pink-400" : "text-pink-600" 
                    : isDark ? "text-zinc-500 group-hover:text-zinc-300" : "text-gray-400 group-hover:text-gray-600"
                }`} />
                {item.label}
                {isActive && <ChevronRight className={`w-3 h-3 ml-auto ${isDark ? 'text-pink-400' : 'text-pink-600'}`} />}
              </Link>
            );
          })}
        </nav>

        {/* Bottom section */}
        <div className={`flex-shrink-0 p-3 border-t ${isDark ? 'border-white/10' : 'border-gray-200'}`}>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all ${
              isDark ? 'text-zinc-400 hover:bg-white/5 hover:text-white' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-900'
            }`}
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            {isDark ? "Light Mode" : "Dark Mode"}
          </button>

          {/* Logout */}
          <button
            onClick={logout}
            className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-xs transition-all cursor-pointer ${
              isDark ? 'text-zinc-400 hover:bg-red-500/10 hover:text-red-500' : 'text-gray-500 hover:bg-red-50 hover:text-red-500'
            }`}
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto">
        {/* Mobile tab bar for admin (visible on small screens) */}
        <div className={`md:hidden flex items-center gap-1 px-3 py-2 overflow-x-auto border-b ${
          isDark ? 'border-white/10' : 'border-gray-200'
        }`}>
          {NAV_ITEMS.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? isDark
                      ? "bg-pink-500/20 text-pink-400 border border-pink-500/30"
                      : "bg-pink-500/10 text-pink-600 border border-pink-500/20"
                    : isDark
                      ? "text-zinc-400 hover:text-white"
                      : "text-gray-500 hover:text-gray-900"
                }`}
              >
                <item.icon className="w-3.5 h-3.5" />
                {item.label}
              </Link>
            );
          })}
        </div>

        {/* Page Content */}
        <div className="p-4 md:p-6">{children}</div>
      </div>
    </div>
  );
}
