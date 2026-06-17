'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SiX, SiYoutube, SiInstagram, SiLinkedin, SiFacebook, SiDiscord } from 'react-icons/si';

interface FooterProps {
  simple?: boolean;
}

export default function Footer({ simple = false }: FooterProps) {
  return (
    <footer className="bg-white/30 dark:bg-zinc-900/50 backdrop-blur-xl border-t border-zinc-200 dark:border-white/10 mt-8 rounded-2xl">
      <div className="px-8 py-12">
        {!simple && (
          <>
            {/* Listed On Section */}
            <div className="mb-12">
              <h3 className="text-zinc-600 dark:text-zinc-400 text-sm font-semibold mb-6 text-center">Listed On</h3>
              <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">Verified on DANCE!</span>
            </div>
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">Featured on Startup Fame</span>
            </div>
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">Listed on AIStage</span>
            </div>
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">Featured on TOOLPILOT</span>
            </div>
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">UNEED Daily Winner</span>
            </div>
            <div className="px-6 py-3 bg-zinc-100 dark:bg-zinc-800/50 rounded-lg border border-zinc-200 dark:border-zinc-700">
              <span className="text-zinc-900 dark:text-white font-semibold">UNEED Weekly Winner</span>
            </div>
          </div>
        </div>
        </>
        )}

        {/* Main Footer Content */}
        <div className={`grid grid-cols-1 ${simple ? 'md:grid-cols-1 max-w-md mx-auto text-center' : 'md:grid-cols-4'} gap-12 mb-8`}>
          {!simple && (
            <>
              {/* About Lily */}
              <div>
                <Link href="/" className="inline-block mb-4">
                  <Image
                    src="/lily-logo.svg"
                    alt="Lily Logo"
                    width={48}
                    height={48}
                    className="w-25 h-auto"
                  />
                </Link>
                <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-4">About Lily</h3>
                <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                  Experience meaningful connections with AI companions. Your perfect virtual girlfriend or boyfriend awaits.
                </p>
              </div>

              {/* Explore */}
              <div>
                <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-4">Explore</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/for-men" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Female Companions
                    </a>
                  </li>
                  <li>
                    <a href="/for-women" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Male Companions
                    </a>
                  </li>
                  <li>
                    <a href="/" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Explore Characters
                    </a>
                  </li>
                  <li>
                    <a href="/monetize" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Monetize Your Character
                    </a>
                  </li>
                </ul>
              </div>

              {/* Support */}
              <div>
                <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-4">Support</h3>
                <ul className="space-y-3">
                  <li>
                    <a href="/faq" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      FAQ
                    </a>
                  </li>
                  <li>
                    <a href="/privacy-policy" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Privacy Policy
                    </a>
                  </li>
                  <li>
                    <a href="/terms-and-conditions" className="text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white text-sm transition-colors">
                      Terms and Conditions
                    </a>
                  </li>
                </ul>
              </div>
            </>
          )}

          {/* Connect With Us */}
          <div>
            {simple && (
              <Link href="/" className="inline-block mb-6">
                <Image
                  src="/lily-logo.svg"
                  alt="Lily Logo"
                  width={48}
                  height={48}
                  className="w-25 h-auto mx-auto"
                />
              </Link>
            )}
            <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-4">Connect With Us</h3>
            <div className={`flex flex-wrap gap-3 mb-6 ${simple ? 'justify-center' : ''}`}>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiX className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiYoutube className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiInstagram className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiLinkedin className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiFacebook className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-200 dark:bg-zinc-800 hover:bg-pink-600 dark:hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiDiscord className="w-5 h-5 text-zinc-900 dark:text-white" />
              </a>
            </div>
            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
              Contact us at:
              <br />
              <a
                href="mailto:info@getlily.in"
                className="text-pink-600 dark:text-pink-400 hover:text-pink-700 dark:hover:text-pink-300 transition-colors"
              >
                info@getlily.in
              </a>
            </p>
          </div>
        </div>

        {!simple && (
          <>
            {/* Important Notice */}
            <div className="bg-zinc-100 dark:bg-zinc-800/30 border border-zinc-300 dark:border-zinc-700/50 rounded-xl p-4 mb-8">
              <h3 className="text-zinc-900 dark:text-white font-bold text-lg mb-3">Important Notice</h3>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm leading-relaxed">
                Lily is a platform for meaningful AI companionship and emotional support. We do not promote or allow explicit
                content, nudity, or inappropriate behavior. Our AI companions are designed for genuine connections and
                conversations, providing comfort, friendship, and emotional support in a safe, respectful environment.
              </p>
            </div>
          </>
        )}

        {/* Copyright */}
        <div className="text-center text-zinc-600 dark:text-zinc-500 text-sm pt-8 border-t border-zinc-300 dark:border-zinc-800">
          <p>&copy; {new Date().getFullYear()} Lily. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
