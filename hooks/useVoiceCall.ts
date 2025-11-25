import { useState, useEffect, useRef, useCallback } from 'react'
import { io, Socket } from 'socket.io-client'

interface VoiceCallState {
    callState: 'idle' | 'connecting' | 'active' | 'ended'
    isMuted: boolean
    isAISpeaking: boolean
    error: string | null
}

export function useVoiceCall(profileId: string) {
    const [state, setState] = useState<VoiceCallState>({
        callState: 'idle',
        isMuted: false,
        isAISpeaking: false,
        error: null,
    })

    const socketRef = useRef<Socket | null>(null)
    const mediaStreamRef = useRef<MediaStream | null>(null)
    const audioContextRef = useRef<AudioContext | null>(null)
    const processorRef = useRef<ScriptProcessorNode | null>(null)
    const audioPlayerRef = useRef<HTMLAudioElement | null>(null)

    // Initialize audio player
    useEffect(() => {
        audioPlayerRef.current = new Audio()
        return () => {
            if (audioPlayerRef.current) {
                audioPlayerRef.current.pause()
                audioPlayerRef.current = null
            }
        }
    }, [])

    // Start voice call
    const startCall = useCallback(async () => {
        try {
            setState(prev => ({ ...prev, callState: 'connecting', error: null }))

            // 1. Request microphone permission
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: true,
                    noiseSuppression: true,
                    autoGainControl: true,
                },
            })
            mediaStreamRef.current = stream

            // 2. Create audio context for processing
            audioContextRef.current = new AudioContext({ sampleRate: 16000 })
            const source = audioContextRef.current.createMediaStreamSource(stream)

            // 3. Create processor for audio chunks
            const processor = audioContextRef.current.createScriptProcessor(4096, 1, 1)
            processorRef.current = processor

            // 4. Connect to Socket.io (Main Server on port 4000)
            const socket = io('http://localhost:4000', {
                auth: {
                    userId: profileId,
                },
            })
            socketRef.current = socket

            // 5. Socket event handlers
            socket.on('connect', () => {
                console.log('Voice socket connected')
                socket.emit('voice:start', { profileId })
            })

            socket.on('voice:ready', () => {
                setState(prev => ({ ...prev, callState: 'active' }))
            })

            socket.on('voice:ai-speaking', () => {
                setState(prev => ({ ...prev, isAISpeaking: true }))
            })

            socket.on('voice:ai-audio', (audioData: { base64: string }) => {
                // Play AI voice
                if (audioPlayerRef.current) {
                    const audioBlob = base64ToBlob(audioData.base64, 'audio/mpeg')
                    const audioUrl = URL.createObjectURL(audioBlob)
                    audioPlayerRef.current.src = audioUrl
                    audioPlayerRef.current.play()

                    audioPlayerRef.current.onended = () => {
                        setState(prev => ({ ...prev, isAISpeaking: false }))
                        URL.revokeObjectURL(audioUrl)
                    }
                }
            })

            socket.on('voice:error', (error: { message: string }) => {
                setState(prev => ({ ...prev, error: error.message }))
            })

            // 6. Process audio chunks
            processor.onaudioprocess = (e) => {
                if (state.isMuted) return

                const inputData = e.inputBuffer.getChannelData(0)
                const pcmData = convertFloat32ToInt16(inputData)

                // Send audio chunk to server
                if (socket.connected) {
                    socket.emit('voice:audio-chunk', {
                        audio: arrayBufferToBase64(pcmData.buffer as ArrayBuffer),
                        sampleRate: audioContextRef.current?.sampleRate || 16000,
                    })
                }
            }

            // Connect audio nodes
            source.connect(processor)
            processor.connect(audioContextRef.current.destination)

        } catch (error) {
            console.error('Error starting call:', error)

            let errorMessage = 'Failed to start call'

            // Handle specific errors
            if (error instanceof Error) {
                if (error.name === 'NotFoundError' || error.message.includes('device not found')) {
                    errorMessage = 'No microphone found. Please connect a microphone and try again.'
                } else if (error.name === 'NotAllowedError' || error.message.includes('permission')) {
                    errorMessage = 'Microphone permission denied. Please allow microphone access in browser settings.'
                } else if (error.name === 'NotReadableError') {
                    errorMessage = 'Microphone is already in use by another application.'
                } else {
                    errorMessage = error.message
                }
            }

            setState(prev => ({
                ...prev,
                callState: 'idle',
                error: errorMessage,
            }))
        }
    }, [profileId, state.isMuted])

    // End call
    const endCall = useCallback(() => {
        // Stop media stream
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop())
            mediaStreamRef.current = null
        }

        // Close audio context
        if (audioContextRef.current) {
            audioContextRef.current.close()
            audioContextRef.current = null
        }

        // Disconnect processor
        if (processorRef.current) {
            processorRef.current.disconnect()
            processorRef.current = null
        }

        // Disconnect socket
        if (socketRef.current) {
            socketRef.current.emit('voice:end')
            socketRef.current.disconnect()
            socketRef.current = null
        }

        // Stop audio player
        if (audioPlayerRef.current) {
            audioPlayerRef.current.pause()
        }

        setState({
            callState: 'ended',
            isMuted: false,
            isAISpeaking: false,
            error: null,
        })
    }, [])

    // Toggle mute
    const toggleMute = useCallback(() => {
        setState(prev => ({ ...prev, isMuted: !prev.isMuted }))
    }, [])

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            endCall()
        }
    }, [endCall])

    return {
        ...state,
        startCall,
        endCall,
        toggleMute,
    }
}

// Helper functions
function convertFloat32ToInt16(buffer: Float32Array): Int16Array {
    const int16 = new Int16Array(buffer.length)
    for (let i = 0; i < buffer.length; i++) {
        const s = Math.max(-1, Math.min(1, buffer[i]))
        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff
    }
    return int16
}

function arrayBufferToBase64(buffer: ArrayBuffer): string {
    const bytes = new Uint8Array(buffer)
    let binary = ''
    for (let i = 0; i < bytes.byteLength; i++) {
        binary += String.fromCharCode(bytes[i])
    }
    return btoa(binary)
}

function base64ToBlob(base64: string, mimeType: string): Blob {
    const byteCharacters = atob(base64)
    const byteNumbers = new Array(byteCharacters.length)
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i)
    }
    const byteArray = new Uint8Array(byteNumbers)
    return new Blob([byteArray], { type: mimeType })
}
