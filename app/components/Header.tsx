'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import { useAuth } from '@/app/contexts/AuthContext';
import { useTheme } from '@/app/contexts/ThemeContext';
import { FaBars, FaSun, FaMoon, FaMars, FaVenus } from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md';
import { Transgender } from 'lucide-react';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const { user, isAuthenticated, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="shrink-0 z-40 bg-transparent backdrop-blur-2xl border-b border-white/20 dark:border-white/10 shadow-sm!">
        <div className="flex items-center px-4 md:px-8 py-3">
          {/* Left side - Logo */}
          <div className="flex-1 flex items-center gap-4">
            <Link href="/" className="flex items-center">
              <Image
                src="/lily-logo.svg"
                alt="Lily Logo"
                width={40}
                height={40}
                className="w-20 h-auto"
              />
            </Link>
          </div>

          {/* Center - Category Links (Desktop Only) */}
          <div className="hidden md:flex items-center gap-4 md:gap-8">
            <Link 
              href="/for-men" 
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group"
            >
              <FaMars className="w-5 h-5 md:w-6 md:h-6 text-blue-500 dark:text-blue-400" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Male</span>
            </Link>
            <Link 
              href="/for-women" 
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group"
            >
              <FaVenus className="w-5 h-5 md:w-6 md:h-6 text-pink-500 dark:text-pink-400" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Female</span>
            </Link>
            <Link 
              href="/for-lgbtq" 
              className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity group"
            >
              <Transgender className="w-5 h-5 md:w-6 md:h-6 text-purple-500 dark:text-purple-400" />
              <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">LGBTQ+</span>
            </Link>
          </div>

          {/* Right side - Theme Toggle, Language and Auth */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-zinc-800/30 dark:hover:bg-white/20 rounded-full transition-colors cursor-pointer"
              aria-label="Toggle theme"
            >
              {theme === 'light' ? (
                <FaMoon className="w-5 h-5 text-zinc-900" />
              ) : (
                <FaSun className="w-5 h-5 text-white" />
              )}
            </button>

            {isAuthenticated && user ? (
              <UserMenu user={user} onLogout={handleLogout} />
            ) : (
              <div className="flex items-center gap-2 md:gap-3">
                <button
                  onClick={() => openAuthModal('signup')}
                  className="hidden sm:block px-4 md:px-6 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-full text-xs md:text-sm font-medium transition-colors border border-zinc-700"
                >
                  Sign Up
                </button>
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-4 md:px-6 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-full text-xs md:text-sm font-medium transition-colors"
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation Bar */}
      <nav className={`md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 shadow-lg ${pathname === '/messages' ? 'hidden' : ''}`}>
        <div className="flex items-center justify-around px-4 py-3">
          <Link 
            href="/for-men" 
            className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity active:scale-95"
          >
            <FaMars className="w-6 h-6 text-blue-500 dark:text-blue-400" />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Male</span>
          </Link>
          <Link 
            href="/for-women" 
            className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity active:scale-95"
          >
            <FaVenus className="w-6 h-6 text-pink-500 dark:text-pink-400" />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">Female</span>
          </Link>
          <Link 
            href="/for-lgbtq" 
            className="flex flex-col items-center gap-1 hover:opacity-80 transition-opacity active:scale-95"
          >
            <Transgender className="w-6 h-6 text-purple-500 dark:text-purple-400" />
            <span className="text-xs text-zinc-700 dark:text-zinc-300 font-medium">LGBTQ+</span>
          </Link>
        </div>
      </nav>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
