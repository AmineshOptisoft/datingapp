"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  Plus,
  Compass,
  MessageCircle,
  Camera,
  Sparkles,
  Users,
  Crown,
  LogIn,
  UserPlus,
  MoreHorizontal,
  Menu,
  X,
} from "lucide-react";
import { SiDiscord } from "react-icons/si";
import { FaMars, FaVenus } from "react-icons/fa";
import { Transgender, Film } from "lucide-react";
import { useAuth } from "@/app/contexts/AuthContext";
import { cn } from "@/lib/utils";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
  onLoginClick?: () => void;
  onSignUpClick?: () => void;
  onUpgradeClick?: () => void;
}


/** Desktop sidebar only — mobile uses bottom bar in Header */
const categoryNavItems = [
  {
    href: "/for-men",
    label: "For-Male",
    Icon: FaMars,
    iconClass: "text-blue-500 dark:text-blue-400",
    activeClass:
      "bg-blue-500/15 dark:bg-blue-400/20 border border-blue-500/40 dark:border-blue-400/50",
  },
  {
    href: "/for-women",
    label: "For-Female",
    Icon: FaVenus,
    iconClass: "text-pink-500 dark:text-pink-400",
    activeClass:
      "bg-pink-500/15 dark:bg-pink-400/20 border border-pink-500/40 dark:border-pink-400/50",
  },
  {
    href: "/for-lgbtq",
    label: "For-LGBTQ+",
    Icon: Transgender,
    iconClass: "text-purple-500 dark:text-purple-400",
    activeClass:
      "bg-purple-500/15 dark:bg-purple-400/20 border border-purple-500/40 dark:border-purple-400/50",
  },
  {
    href: "/reels",
    label: "Reels",
    Icon: Film,
    iconClass: "text-pink-500 dark:text-pink-400",
    activeClass:
      "bg-pink-500/15 dark:bg-pink-400/20 border border-pink-500/40 dark:border-pink-400/50",
  },
];

const navLinkClass = (active: boolean) =>
  cn(
    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
    active
      ? "bg-zinc-200 text-zinc-900 dark:bg-white/10 dark:text-white"
      : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5"
  );

const bottomActionClass =
  "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5 transition-colors";

const iconBtnClass =
  "p-1.5 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/10 rounded-lg transition-colors";

export default function Sidebar({
  isOpen = true,
  onClose,
  onLoginClick,
  onSignUpClick,
  onUpgradeClick,
}: SidebarProps) {
  const pathname = usePathname();
  const { isAuthenticated } = useAuth();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  return (
    <>
      <aside
        className={cn(
          "app-sidebar fixed md:static w-[220px] shrink-0 flex flex-col h-screen-dvh z-50",
          "transition-transform duration-300 ease-in-out",
          isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        )}
      >
        <div className="flex items-center justify-between px-4 pt-5 pb-4">
          <Link href="/" className="block px-1" onClick={onClose}>
            <Image
              src="/lily-logo.svg"
              alt="Lily"
              width={120}
              height={40}
              className="h-8 w-auto dark:brightness-100 brightness-90"
              priority
            />
          </Link>
            <button
              type="button"
              onClick={onClose}
              className={cn(iconBtnClass, "md:hidden")}
              aria-label="Close menu"
            >
              <X className="w-5 h-5" />
            </button>

        </div>

        {/* Category links — md+ sidebar only (mobile uses bottom bar) */}
        <nav className="hidden md:block px-3 pb-3 space-y-0.5 border-b border-zinc-200 dark:border-white/5">
          {categoryNavItems.map((item) => {
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors border border-transparent",
                  active
                    ? item.activeClass
                    : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:text-white dark:hover:bg-white/5"
                )}
              >
                <item.Icon className={cn("w-[18px] h-[18px] shrink-0", item.iconClass)} />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        

        <div className="px-3 pb-5 pt-2 space-y-1 border-t border-zinc-200 dark:border-white/5 mt-auto">
          <button
            type="button"
            onClick={onUpgradeClick}
            className={cn(
              "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium mb-2 transition-colors",
              "text-violet-700 border border-violet-400/60 hover:bg-violet-100",
              "dark:text-violet-300 dark:border-violet-500/50 dark:hover:bg-violet-500/10"
            )}
          >
            <Crown className="w-4 h-4" />
            Upgrade
          </button>

          {!isAuthenticated && (
            <>
              <button type="button" onClick={onLoginClick} className={bottomActionClass}>
                <LogIn className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                Login
              </button>
              <button type="button" onClick={onSignUpClick} className={bottomActionClass}>
                <UserPlus className="w-[18px] h-[18px] shrink-0" strokeWidth={1.75} />
                Sign Up
              </button>
            </>
          )}
        </div>
      </aside>
    </>
  );
}
