'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  FaMars,
  FaVenus,
  FaHeart,
  FaDollarSign,
  FaChartLine,
  FaTimes,
  FaComments,
} from 'react-icons/fa';
import { MdAddCircle } from 'react-icons/md';
import {
  SiX,
  SiYoutube,
  SiInstagram,
  SiLinkedin,
  SiFacebook,
  SiDiscord,
  SiReddit,
} from 'react-icons/si';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = true, onClose }: SidebarProps) {
  const [activeNav, setActiveNav] = useState('');
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCategory = searchParams.get('category');

  const navigationItems = [
    { icon: FaMars, label: 'For Male', id: 'male', href: '/for-men' },
    { icon: FaVenus, label: 'For Female', id: 'female', href: '/for-women' },
    { icon: MdAddCircle, label: 'For LGBTQ+', id: 'lgbtq', href: '/for-lgbtq' },
    { icon: FaDollarSign, label: 'Affiliate Program', id: 'affiliate', href: '/affiliate-program' },
    { icon: FaChartLine, label: 'Monetize Your Character', id: 'monetize', href: '/monetize' },
    { icon: FaComments, label: 'Messages', id: 'messages', href: '/messages' },
  ];

  const premiumCategories = [
    { icon: FaHeart, label: 'Infidelity & Drama', id: 'infidelity' },
    { icon: FaHeart, label: 'Relationship Stages', id: 'relationship' },
    { icon: FaHeart, label: 'Fantasy & Kinks', id: 'fantasy' },
    { icon: FaHeart, label: 'Nationalities & Cultures', id: 'nationalities' },
  ];

  const socialIcons = [
    { icon: SiX, label: 'X (Twitter)' },
    { icon: SiYoutube, label: 'YouTube' },
    { icon: SiInstagram, label: 'Instagram' },
    { icon: SiLinkedin, label: 'LinkedIn' },
    { icon: SiFacebook, label: 'Facebook' },
    { icon: SiDiscord, label: 'Discord' },
    { icon: SiReddit, label: 'Reddit' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
        fixed md:static
        w-[280px] md:w-[200px]
        bg-transparent backdrop-blur-2xl border-r border-white/10
        flex flex-col h-screen md:shrink-0 shadow-2xl
        z-50
        transition-transform duration-300 ease-in-out
        ${isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}
      >
        {/* Logo and Close Button */}
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
                <span className="text-black font-bold text-sm">🖼️</span>
              </div>
              <span className="text-white font-bold text-xl">IDYLL</span>
            </div>
            <button
              onClick={onClose}
              className="md:hidden p-2 text-white hover:bg-white/10 rounded-lg transition-colors"
              aria-label="Close menu"
            >
              <FaTimes className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4">
            <h3 className="text-zinc-500 text-xs font-semibold mb-3 uppercase">Navigation</h3>
            <nav className="space-y-1">
              {navigationItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-300 ${pathname === item.href
                    ? 'bg-white/10 text-white backdrop-blur-sm shadow-lg'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white hover:backdrop-blur-sm'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </div>
                  <svg
                    className="w-3 h-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </Link>
              ))}
            </nav>
          </div>

          {/* Premium Categories */}
          <div className="p-4 border-t border-white/10">
            <h3 className="text-zinc-500 text-xs font-semibold mb-3 uppercase">
              Premium Categories
            </h3>
            <nav className="space-y-1">
              {premiumCategories.map((item) => (
                <Link
                  key={item.id}
                  href={{
                    pathname: '/',
                    query: { category: item.label },
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-all duration-300 ${pathname === '/' && currentCategory === item.label
                    ? 'bg-white/10 text-white backdrop-blur-sm shadow-lg'
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white hover:backdrop-blur-sm'
                    }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <item.icon className="w-4 h-4 shrink-0" />
                    <span className="text-xs truncate">{item.label}</span>
                  </div>
                  {item.id === 'nationalities' && (
                    <svg
                      className="w-3 h-3"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                  )}
                </Link>
              ))}
            </nav>
          </div>
        </div>

        {/* Social Icons */}
        <div className="p-4 border-t border-white/10">
          <div className="flex flex-wrap gap-2 justify-center">
            {socialIcons.map((social, index) => (
              <button
                key={index}
                className="w-8 h-8 bg-yellow-500 rounded flex items-center justify-center hover:bg-yellow-600 transition-colors"
                aria-label={social.label}
              >
                <social.icon className="w-4 h-4 text-black" />
              </button>
            ))}
          </div>
        </div>
      </aside>
    </>
  );
}
