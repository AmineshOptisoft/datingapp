import http from 'http'
import { Server as SocketIOServer } from 'socket.io'
import dotenv from 'dotenv'
import mongoose from 'mongoose'
import AIProfile from './models/AIProfile'
import VoiceSession from './models/VoiceSession'
import { verifyToken } from './lib/auth'
import { buildEnhancedPersona } from './lib/voice-persona-enhanced'
import { AudioBuffer, detectSilence } from './lib/streaming-audio'

dotenv.config({ path: '.env.local' })

const PORT = 4001
const MONGO_URI = process.env.MONGODB_URI || 'mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app'

// Connect to MongoDB
mongoose.connect(MONGO_URI)
    .then(() => console.log('✅ MongoDB connected for voice server'))
    .catch((err) => {
        console.error('❌ Mongo connection error:', err)
        process.exit(1)
    })

const server = http.createServer()

const io = new SocketIOServer(server, {
    cors: {
        origin: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true,
    },
})

// Store active call sessions
const activeCalls = new Map<string, {
    userId: string
    profileId: string
    audioBuffer: AudioBuffer
    session: any
    profile: any
}>()

io.use((socket, next) => {
    const token = socket.handshake.auth.token
    if (!token) return next(new Error('Authentication required'))

    try {
        const decoded = verifyToken(token)
        if (!decoded) {
            return next(new Error('Invalid token'))
        }
        socket.data.userId = decoded.userId
        next()
    } catch (error) {
        next(new Error('Invalid token'))
    }
})

io.on('connection', (socket) => {
    console.log(`🔌 User connected: ${socket.data.userId}`)

    // Start voice call
    socket.on('voice:start', async ({ profileId }) => {
        try {
            const userId = socket.data.userId
            console.log(`📞 Starting call: User ${userId} → Profile ${profileId}`)

            // Load AI profile
            const profile = await AIProfile.findOne({
                profileId,
                profileType: 'ai',
                isActive: true,
                audienceSegment: 'for-men',
            })

            if (!profile) {
                socket.emit('voice:error', { message: 'Profile not found' })
                return
            }

            // Get or create voice session
            let session = await VoiceSession.findOne({ userId, profileId })
            if (!session) {
                session = await VoiceSession.create({
                    userId,
                    profileId,
                    messages: [],
                })
            }

            // Initialize audio buffer
            const audioBuffer = new AudioBuffer()

            // Store active call
            activeCalls.set(socket.id, {
                userId,
                profileId,
                audioBuffer,
                session,
                profile,
            })

            socket.emit('voice:ready', {
                profileName: profile.name,
                profileAvatar: profile.avatar,
            })

            console.log(`✅ Call ready: ${profile.name}`)
        } catch (error) {
            console.error('Error starting call:', error)
            socket.emit('voice:error', { message: 'Failed to start call' })
        }
    })

    // Receive audio chunks
    socket.on('voice:audio-chunk', async ({ audio, sampleRate }) => {
        try {
            const call = activeCalls.get(socket.id)
            if (!call) return

            // Convert base64 to buffer
            const audioChunk = Buffer.from(audio, 'base64')
            call.audioBuffer.addChunk(audioChunk)

            // Check if user stopped speaking (silence detection)
            if (detectSilence(call.audioBuffer)) {
                console.log('🔇 Silence detected, processing audio...')

                // Get complete audio
                const completeAudio = call.audioBuffer.getAudio()
                call.audioBuffer.clear()

                // Process audio in background
                processUserAudio(socket, call, completeAudio, sampleRate)
            }
        } catch (error) {
            console.error('Error processing audio chunk:', error)
        }
    })

    // User interrupts AI
    socket.on('voice:interrupt', () => {
        const call = activeCalls.get(socket.id)
        if (call) {
            call.audioBuffer.clear()
            console.log('⏹️ User interrupted AI')
        }
    })

    // End call
    socket.on('voice:end', async () => {
        const call = activeCalls.get(socket.id)
        if (call) {
            await call.session.save()
            activeCalls.delete(socket.id)
            console.log(`📴 Call ended: User ${call.userId}`)
        }
    })

    socket.on('disconnect', () => {
        const call = activeCalls.get(socket.id)
        if (call) {
            activeCalls.delete(socket.id)
            console.log(`🔌 User disconnected: ${call.userId}`)
        }
    })
})

// Process user audio and generate AI response
async function processUserAudio(
    socket: any,
    call: any,
    audioBuffer: Buffer,
    sampleRate: number
) {
    try {
        // 1. Transcribe with ElevenLabs STT
        const transcript = await transcribeAudio(audioBuffer, sampleRate)
        if (!transcript) {
            console.log('⚠️ Empty transcription')
            return
        }

        console.log(`📝 User said: "${transcript}"`)

        // 2. Build enhanced persona prompt
        const recentMessages = call.session.messages.slice(-5).map((m: any) => m.content)
        const personaPrompt = buildEnhancedPersona(call.profile, transcript, recentMessages)

        // 3. Generate AI response with Grok
        const history = call.session.messages.slice(-10)
        const llmMessages = [
            { role: 'system', content: personaPrompt },
            ...history.map((m: any) => ({ role: m.role, content: m.content })),
            { role: 'user', content: transcript },
        ]

        const aiResponse = await callGrok(llmMessages)
        console.log(`💬 AI response: "${aiResponse}"`)

        // 4. Convert to speech with ElevenLabs TTS
        socket.emit('voice:ai-speaking')

        const voiceSettings = getVoiceSettings(call.profile)
        const audioBase64 = await synthesizeSpeech(aiResponse, voiceSettings)

        // 5. Send audio to client
        socket.emit('voice:ai-audio', { base64: audioBase64 })

        // 6. Save to session
        call.session.messages.push(
            { role: 'user', content: transcript, createdAt: new Date() },
            { role: 'assistant', content: aiResponse, createdAt: new Date() }
        )

        if (call.session.messages.length > 50) {
            call.session.messages = call.session.messages.slice(-50)
        }

        await call.session.save()
    } catch (error) {
        console.error('Error processing user audio:', error)
        socket.emit('voice:error', { message: 'Failed to process audio' })
    }
}

// ElevenLabs STT
async function transcribeAudio(audioBuffer: Buffer, sampleRate: number): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY')

    const formData = new FormData()
    const audioBlob = new Blob([audioBuffer as any], { type: 'audio/wav' })
    formData.append('file', audioBlob, 'audio.wav')
    formData.append('model_id', process.env.ELEVENLABS_STT_MODEL_ID || 'eleven_multilingual_v2')
    formData.append('language_code', 'en')

    const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: { 'xi-api-key': apiKey },
        body: formData,
    })

    if (!response.ok) {
        throw new Error(`STT error: ${await response.text()}`)
    }

    const result = await response.json()
    return (result.text || result.transcription || '').trim()
}

// Grok LLM
async function callGrok(messages: { role: string; content: string }[]) {
    const apiKey = process.env.GROK_API_KEY
    if (!apiKey) throw new Error('Missing GROK_API_KEY')

    const response = await fetch('https://api.x.ai/v1/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            model: 'grok-beta',
            temperature: 0.85,
            stream: false,
            messages,
        }),
    })

    const payload = await response.json()
    if (!response.ok) {
        throw new Error(payload?.error?.message || 'Grok request failed')
    }

    const choice = payload.choices?.[0]?.message
    if (!choice) throw new Error('Empty Grok response')

    if (Array.isArray(choice.content)) {
        return choice.content.map((c: any) => c.text || c).join('').trim()
    }

    return (choice.content || '').trim()
}

// ElevenLabs TTS
async function synthesizeSpeech(text: string, settings: any): Promise<string> {
    const apiKey = process.env.ELEVENLABS_API_KEY
    if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY')

    const voiceId = settings.voiceId || process.env.ELEVENLABS_FEMALE_VOICE_ID
    if (!voiceId) throw new Error('Missing voice ID')

    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
        method: 'POST',
        headers: {
            'xi-api-key': apiKey,
            'Content-Type': 'application/json',
            accept: 'audio/mpeg',
        },
        body: JSON.stringify({
            text,
            model_id: settings.voiceModelId || 'eleven_monolingual_v1',
            voice_settings: {
                stability: settings.stability ?? 0.55,
                similarity_boost: settings.similarity ?? 0.75,
                style: settings.style ?? 0.35,
                use_speaker_boost: true,
            },
        }),
    })

    if (!response.ok) {
        throw new Error(`TTS error: ${await response.text()}`)
    }

    const buffer = Buffer.from(await response.arrayBuffer())
    return buffer.toString('base64')
}

// Get voice settings for profile
function getVoiceSettings(profile: any) {
    const cardTitle = profile.cardTitle?.toLowerCase() || ''

    // Default settings
    let settings = {
        voiceId: profile.voiceId,
        voiceModelId: profile.voiceModelId,
        stability: 0.55,
        similarity: 0.75,
        style: 0.35,
    }

    // Personality-specific adjustments
    if (cardTitle.includes('introvert') || cardTitle.includes('shy')) {
        settings.stability = 0.70
        settings.style = 0.20
    } else if (cardTitle.includes('extrovert') || cardTitle.includes('energetic')) {
        settings.stability = 0.45
        settings.style = 0.65
    } else if (cardTitle.includes('bold') || cardTitle.includes('confident')) {
        settings.stability = 0.40
        settings.style = 0.75
    } else if (cardTitle.includes('seductive') || cardTitle.includes('flirty')) {
        settings.stability = 0.50
        settings.style = 0.60
    }

    return settings
}

server.listen(PORT, () => {
    console.log(`🎙️ Voice call server running on http://localhost:${PORT}`)
})
