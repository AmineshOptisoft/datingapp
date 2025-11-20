'use client';

import { useState } from 'react';
import AuthModal from './AuthModal';
import UserMenu from './UserMenu';
import { useAuth } from '@/app/contexts/AuthContext';
import { FaBars } from 'react-icons/fa';

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<'login' | 'signup' | 'forgot'>('login');
  const { user, isAuthenticated, logout } = useAuth();

  const openAuthModal = (mode: 'login' | 'signup' | 'forgot') => {
    setAuthMode(mode);
    setIsAuthModalOpen(true);
  };

  const handleLogout = () => {
    logout();
  };

  return (
    <>
      <header className="shrink-0 z-40 bg-transparent backdrop-blur-2xl border-b border-white/10 shadow-lg">
        <div className="flex items-center justify-between px-4 md:px-8 py-4">
          {/* Left side - Hamburger Menu for Mobile */}
          <div className="flex items-center gap-4">
            <button
              onClick={onMenuToggle}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Toggle menu"
            >
              <FaBars className="w-6 h-6" />
            </button>
            <div className="flex-1" />
          </div>

          {/* Center - Buttons */}
          <div className="flex items-center gap-2 md:gap-4">
            <button className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-xs md:text-sm font-medium transition-colors">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
              <span className="hidden lg:inline">Memory Live!</span>
            </button>

            <button className="hidden sm:flex items-center gap-2 px-3 md:px-4 py-2 bg-purple-100 hover:bg-purple-200 text-purple-700 rounded-full text-xs md:text-sm font-medium transition-colors">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
              </svg>
              <span className="hidden lg:inline">Collections</span>
            </button>

            <button className="flex items-center gap-2 px-3 md:px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-black rounded-full text-xs md:text-sm font-medium transition-colors">
              <svg className="w-3 md:w-4 h-3 md:h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11H9v-2h2v2zm0-4H9V5h2v4z" />
              </svg>
              <span className="hidden lg:inline">Try FREE Demo</span>
              <span className="sm:hidden">Demo</span>
            </button>
          </div>

          {/* Right side - Language and Auth */}
          <div className="flex-1 flex items-center justify-end gap-2 md:gap-4">
            <div className="hidden md:flex items-center gap-2 text-zinc-400 text-sm">
              <span>US</span>
              <span>EN</span>
            </div>

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

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}
