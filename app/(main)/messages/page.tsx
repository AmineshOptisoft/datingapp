import { Suspense } from 'react';
import MessagesClient from './MessagesClient';

export default function MessagesPage() {
  return (
    <Suspense fallback={
      <div className="h-[calc(100vh-80px)] flex items-center justify-center bg-gradient-to-br from-zinc-900 via-purple-900/10 to-zinc-900">
        <div className="text-center">
          {/* Premium animated loader */}
          <div className="relative w-24 h-24 mx-auto mb-6">
            {/* Outer rotating gradient ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 opacity-30 blur-sm animate-spin" style={{ animationDuration: '3s' }}></div>
            {/* Main spinner */}
            <div className="absolute inset-2 border-4 border-transparent border-t-purple-500 border-r-pink-500 rounded-full animate-spin"></div>
            {/* Inner pulsing glow */}
            <div className="absolute inset-4 bg-gradient-to-br from-purple-500/40 to-pink-500/40 rounded-full animate-pulse"></div>
            {/* Center icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-12 h-12 text-purple-400 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </div>
          
          {/* Text */}
          <div className="space-y-2">
            <p className="text-white font-semibold text-xl">Loading Messages</p>
            <p className="text-zinc-400">Preparing your conversations...</p>
          </div>
          
          {/* Animated dots */}
          <div className="flex gap-2 justify-center mt-6">
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
            <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
          </div>
        </div>
      </div>
    }>
      <MessagesClient />
    </Suspense>
  );
}

