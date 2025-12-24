'use client';

import Image from 'next/image';
import Link from 'next/link';
import { SiX, SiYoutube, SiInstagram, SiLinkedin, SiFacebook, SiDiscord } from 'react-icons/si';

export default function Footer() {
  return (
    <footer className="bg-zinc-900/50 backdrop-blur-xl border-t border-white/10 mt-20">
      <div className="max-w-7xl mx-auto px-8 py-12">
        {/* Listed On Section */}
        <div className="mb-12">
          <h3 className="text-zinc-400 text-sm font-semibold mb-6 text-center">Listed On</h3>
          <div className="flex flex-wrap items-center justify-center gap-8">
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">Verified on DANCE!</span>
            </div>
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">Featured on Startup Fame</span>
            </div>
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">Listed on AIStage</span>
            </div>
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">Featured on TOOLPILOT</span>
            </div>
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">UNEED Daily Winner</span>
            </div>
            <div className="px-6 py-3 bg-zinc-800/50 rounded-lg border border-zinc-700">
              <span className="text-white font-semibold">UNEED Weekly Winner</span>
            </div>
          </div>
        </div>

        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          {/* About Idyll */}
          <div>
            <Link href="/" className="inline-block mb-4">
              <Image
                src="/lily-logo.svg"
                alt="Idyll Logo"
                width={48}
                height={48}
                className="w-25 h-auto"
              />
            </Link>
            <h3 className="text-white font-bold text-lg mb-4">About Lily</h3>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Experience meaningful connections with AI companions. Your perfect virtual girlfriend or boyfriend awaits.
            </p>
          </div>

          {/* Explore */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Explore</h3>
            <ul className="space-y-3">
              <li>
                <a href="/for-men" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Female Companions
                </a>
              </li>
              <li>
                <a href="/for-women" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Male Companions
                </a>
              </li>
              <li>
                <a href="/" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Explore Characters
                </a>
              </li>
              <li>
                <a href="/monetize" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Monetize Your Character
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              <li>
                <a href="/faq" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  FAQ
                </a>
              </li>
              <li>
                <a href="/privacy-policy" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a href="/terms-and-conditions" className="text-zinc-400 hover:text-white text-sm transition-colors">
                  Terms and Conditions
                </a>
              </li>
            </ul>
          </div>

          {/* Connect With Us */}
          <div>
            <h3 className="text-white font-bold text-lg mb-4">Connect With Us</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiX className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiYoutube className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiInstagram className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiLinkedin className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiFacebook className="w-5 h-5 text-white" />
              </a>
              <a
                href="#"
                className="w-10 h-10 bg-zinc-800 hover:bg-pink-600 rounded-lg flex items-center justify-center transition-colors"
              >
                <SiDiscord className="w-5 h-5 text-white" />
              </a>
            </div>
            <p className="text-zinc-400 text-sm">
              Contact us at:
              <br />
              <a
                href="mailto:info@getidyll.in"
                className="text-pink-400 hover:text-pink-300 transition-colors"
              >
                info@getidyll.in
              </a>
            </p>
          </div>
        </div>

        {/* Volume Discount Banner */}
        <div className="bg-yellow-900/20 border border-yellow-600/30 rounded-2xl p-6 mb-12">
          <h3 className="text-yellow-500 font-bold text-xl mb-2">
            Volume Discount: Save 25% on Bulk Purchases
          </h3>
          <p className="text-zinc-300 text-sm mb-4">
            Looking to purchase more than 5 character subscriptions? Contact us for a special 25% discount on bulk orders.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <button className="px-6 py-3 bg-yellow-600 hover:bg-yellow-700 text-black font-semibold rounded-lg transition-colors">
              Contact for Bulk Discount
            </button>
            <span className="text-zinc-400 text-sm">
              Or email us directly at:{' '}
              <a
                href="mailto:info@getidyll.in"
                className="text-yellow-500 hover:text-yellow-400 transition-colors"
              >
                info@getidyll.in
              </a>
            </span>
          </div>
        </div>

        {/* Important Notice */}
        <div className="bg-zinc-800/30 border border-zinc-700/50 rounded-xl p-6 mb-8">
          <h3 className="text-white font-bold text-lg mb-3">Important Notice</h3>
          <p className="text-zinc-400 text-sm leading-relaxed">
            Idyll is a platform for meaningful AI companionship and emotional support. We do not promote or allow explicit
            content, nudity, or inappropriate behavior. Our AI companions are designed for genuine connections and
            conversations, providing comfort, friendship, and emotional support in a safe, respectful environment.
          </p>
        </div>

        {/* Copyright */}
        <div className="text-center text-zinc-500 text-sm pt-8 border-t border-zinc-800">
          <p>&copy; {new Date().getFullYear()} Idyll. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
