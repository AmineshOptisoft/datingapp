'use client';

import { useState } from 'react';
import { girlProfiles as allGirls } from '@/lib/data/girls';

export default function FreeTrialPage() {
  return (
    <div className="min-h-screen px-4 md:px-6 lg:px-8 py-8">
      {/* Title */}
      <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-12 bg-linear-to-r from-pink-500 via-purple-500 to-indigo-500 bg-clip-text text-transparent">
        Experience FREE AI Girlfriend
      </h1>

      {/* Main Grid - Steps on left, Cards on right */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Steps */}
        <div className="space-y-8">
          {/* Step 1 */}
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-linear-to-br from-pink-500 to-purple-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Click on Start button</h2>
                <p className="text-zinc-400 text-sm">Begin your free talk with your AI companion.</p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-linear-to-br from-purple-500 to-indigo-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Connect & Chat</h2>
                <p className="text-zinc-400 text-sm">Engage in meaningful conversations with your AI companion.</p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-white/5 rounded-2xl p-6 backdrop-blur-sm border border-white/10">
            <div className="flex gap-4">
              <div className="shrink-0 w-12 h-12 rounded-full flex items-center justify-center bg-linear-to-br from-indigo-500 to-blue-600">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-white mb-2">Choose Your Match</h2>
                <p className="text-zinc-400 text-sm">Explore our collection of AI companions and find your perfect match.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - AI Girlfriend Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {allGirls.slice(0, 2).map((girl) => (
            <div key={girl.profileId} className="relative group">
              <div className="relative rounded-2xl overflow-hidden h-[400px]">
                <img
                  src={girl.avatar}
                  alt={girl.name}
                  className="w-full h-full object-cover"
                />
                
                {/* Overlay */}
                <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/30 to-transparent" />
                
                {/* Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h3 className="text-white text-xl font-bold mb-4">
                    {girl.name} <span className="text-zinc-300 text-sm">({girl.category} - TRIAL)</span>
                  </h3>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center gap-3">
                    {/* Voice Button */}
                    <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all hover:scale-110" style={{ backgroundColor: '#f97316' }}>
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                      </svg>
                    </button>
                    
                    {/* More Options */}
                    <button className="w-12 h-12 rounded-full flex items-center justify-center transition-all bg-zinc-700 hover:bg-zinc-600">
                      <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                      </svg>
                    </button>
                    
                    {/* Start Button */}
                    <button className="flex-1 flex items-center justify-center gap-2 py-3 px-6 rounded-full font-semibold transition-all hover:scale-105" style={{ backgroundColor: '#3b82f6' }}>
                      <span className="text-white">Start</span>
                      <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

