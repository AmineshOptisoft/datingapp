'use client'

import { useState } from 'react'
import { useVoiceCall } from '@/hooks/useVoiceCall'
import type { IAIProfile } from '@/models/AIProfile'

interface VoiceCallPanelProps {
    profile: IAIProfile
}

export function VoiceCallPanel({ profile }: VoiceCallPanelProps) {
    const { callState, isMuted, isAISpeaking, error, startCall, endCall, toggleMute } = useVoiceCall(profile.profileId)
    const [showMenu, setShowMenu] = useState(false)

    return (
        <div className="relative w-full max-w-md mx-auto rounded-2xl overflow-hidden shadow-2xl">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${profile.avatar})` }}
            >
                <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-black/80" />
            </div>

            {/* Content */}
            <div className="relative z-10 p-6 min-h-[500px] flex flex-col justify-between">
                 {/* Status Message */}
                {/* {callState === 'ended' && (
                    <div className="bg-black/80 rounded-lg p-4 mb-4">
                        <p className="text-white text-sm font-medium">Session completed</p>
                        <p className="text-white/70 text-xs mt-1">Session completed.</p>
                    </div>
                )} */}

                {/* Error Message Only */}
                {error && (
                    <div className="bg-red-500/90 rounded-lg p-4 mb-4">
                        <p className="text-white text-sm font-medium">Error</p>
                        <p className="text-white/90 text-xs mt-1">{error}</p>
                    </div>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Profile Info */}
                <div className="mb-6">
                    <h2 className="text-white text-2xl font-bold drop-shadow-lg">
                        {profile.name}
                    </h2>
                    <p className="text-white/90 text-sm mt-1 drop-shadow">
                        {profile.cardTitle} - {profile.category}
                    </p>

                    {/* Call Status */}
                    {callState === 'connecting' && (
                        <p className="text-white/80 text-sm mt-2 animate-pulse">
                            Connecting...
                        </p>
                    )}
                    {callState === 'active' && (
                        <div className="mt-2">
                            <p className="text-green-400 text-sm font-medium">
                                ● Call in progress
                            </p>
                            {isAISpeaking && (
                                <p className="text-white/80 text-xs mt-1 animate-pulse">
                                    🎤 {profile.name} is speaking...
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center justify-center gap-4">
                    {/* Microphone Button */}
                    {callState === 'active' && (
                        <button
                            onClick={toggleMute}
                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${isMuted
                                    ? 'bg-red-500 hover:bg-red-600'
                                    : 'bg-white/20 hover:bg-white/30 backdrop-blur-sm'
                                }`}
                            aria-label={isMuted ? 'Unmute' : 'Mute'}
                        >
                            <span className="text-2xl">
                                {isMuted ? '🔇' : '🎤'}
                            </span>
                        </button>
                    )}

                    {/* Menu Button */}
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-14 h-14 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm flex items-center justify-center transition-all"
                        aria-label="Menu"
                    >
                        <span className="text-2xl">⋯</span>
                    </button>

                    {/* Start/End Call Button */}
                    {callState === 'idle' || callState === 'ended' ? (
                        <button
                            onClick={startCall}
                            className="px-8 py-3 rounded-full bg-blue-500 hover:bg-blue-600 text-white font-medium flex items-center gap-2 transition-all shadow-lg"
                        >
                            <span>Start</span>
                            <span>▶</span>
                        </button>
                    ) : callState === 'active' ? (
                        <button
                            onClick={endCall}
                            className="px-8 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-medium flex items-center gap-2 transition-all shadow-lg"
                        >
                            <span>End Call</span>
                            <span>✕</span>
                        </button>
                    ) : (
                        <button
                            disabled
                            className="px-8 py-3 rounded-full bg-gray-500 text-white font-medium flex items-center gap-2 opacity-50 cursor-not-allowed"
                        >
                            <span>Connecting...</span>
                        </button>
                    )}
                </div>

                {/* Menu Dropdown */}
                {showMenu && (
                    <div className="absolute bottom-24 right-6 bg-black/90 backdrop-blur-sm rounded-lg p-4 min-w-[200px] shadow-xl">
                        <button className="w-full text-left text-white hover:text-blue-400 py-2 px-3 rounded hover:bg-white/10 transition-colors">
                            View Profile
                        </button>
                        <button className="w-full text-left text-white hover:text-blue-400 py-2 px-3 rounded hover:bg-white/10 transition-colors">
                            Settings
                        </button>
                        <button className="w-full text-left text-white hover:text-blue-400 py-2 px-3 rounded hover:bg-white/10 transition-colors">
                            Report Issue
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
