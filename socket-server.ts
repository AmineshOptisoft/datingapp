import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "./models/Message";
import AIProfile from "./models/AIProfile";
import VoiceSession from "./models/VoiceSession";
import { buildEnhancedPersona } from "./lib/voice-persona-enhanced";
import { AudioBuffer, detectSilence } from "./lib/streaming-audio";

// ==================== TYPES & INTERFACES ====================

interface VoiceSettings {
  voiceId: string;
  voiceModelId: string;
  stability: number;
  similarity: number;
  style: number;
}

interface ActiveCall {
  userId: string;
  profileId: string;
  audioBuffer: AudioBuffer;
  session: any; // VoiceSession document
  profile: any; // AIProfile document
  isProcessing: boolean; // Processing lock
  isSaving: boolean; // Save lock to prevent parallel saves
  startTime: number; // Call start timestamp
  timeoutId?: NodeJS.Timeout; // Call timeout handler
  lastActivityTime: number; // Last activity timestamp
}

interface LLMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

enum ErrorType {
  PROFILE_NOT_FOUND = 'PROFILE_NOT_FOUND',
  STT_FAILED = 'STT_FAILED',
  LLM_FAILED = 'LLM_FAILED',
  TTS_FAILED = 'TTS_FAILED',
  PROCESSING_ERROR = 'PROCESSING_ERROR',
  CALL_TIMEOUT = 'CALL_TIMEOUT',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
}

interface VoiceError {
  type: ErrorType;
  message: string;
  details?: any;
}

dotenv.config({ path: '.env.local' });

const PORT = 4000;
const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app";

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Mongo connection error:", err);
    process.exit(1);
  }
})();

const server = http.createServer();

const io = new SocketIOServer(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST"],
    credentials: true,
  },
});

// ==================== CONSTANTS ====================

const CALL_TIMEOUT_MS = 30 * 60 * 1000; // 30 minutes
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // 1 minute
const MAX_REQUESTS_PER_WINDOW = 20; // Max 20 processing requests per minute (prevent ElevenLabs blocking)

// ==================== STATE MANAGEMENT ====================

// Store active voice call sessions
const activeCalls = new Map<string, ActiveCall>();

// Rate limiting: Map<userId, Array<timestamp>>
const rateLimitMap = new Map<string, number[]>();

// ==================== HELPER FUNCTIONS ====================

// Check if user is rate limited
function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];

  // Remove old timestamps outside the window
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );

  // Update map
  rateLimitMap.set(userId, recentRequests);

  // Check if limit exceeded
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false; // Rate limited
  }

  // Add current request
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);

  return true; // Not rate limited
}

// Setup call timeout
function setupCallTimeout(socketId: string, call: ActiveCall): void {
  // Clear existing timeout if any
  if (call.timeoutId) {
    clearTimeout(call.timeoutId);
  }

  // Set new timeout
  call.timeoutId = setTimeout(() => {
    console.log(`⏰ Call timeout for user ${call.userId}`);

    // Get socket and emit timeout event
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit('voice:error', {
        type: ErrorType.CALL_TIMEOUT,
        message: 'Call exceeded maximum duration (30 minutes)',
      });
      socket.emit('voice:ended', { reason: 'timeout' });
    }

    // Cleanup
    cleanupCall(socketId, call);
  }, CALL_TIMEOUT_MS);
}

// Cleanup call resources
async function cleanupCall(socketId: string, call: ActiveCall): Promise<void> {
  try {
    // Clear timeout
    if (call.timeoutId) {
      clearTimeout(call.timeoutId);
    }

    // Save session (with lock to prevent parallel saves)
    if (call.session && !call.isSaving) {
      call.isSaving = true;
      try {
        await call.session.save();
      } catch (saveError) {
        console.error('Error saving session:', saveError);
      } finally {
        call.isSaving = false;
      }
    }

    // Clear audio buffer
    if (call.audioBuffer) {
      call.audioBuffer.clear();
    }

    // Remove from active calls
    activeCalls.delete(socketId);

    console.log(`🧹 Cleaned up call for user ${call.userId}`);
  } catch (error) {
    console.error('Error cleaning up call:', error);
  }
}

// Send typed error to client
function sendVoiceError(
  socket: any,
  type: ErrorType,
  message: string,
  details?: any
): void {
  const error: VoiceError = { type, message, details };
  socket.emit('voice:error', error);
  console.error(`❌ ${type}: ${message}`, details || '');
}

io.use((socket, next) => {
  const userId = socket.handshake.auth.userId;
  if (!userId) return next(new Error("UserId required"));
  socket.data.userId = userId;
  next();
});

io.on("connection", (socket) => {
  console.log(`🔌 User connected: ${socket.data.userId}`);

  // ==================== TEXT CHAT HANDLERS ====================

  // Save and broadcast user message + AI reply sequence
  socket.on("send_message", async (data) => {
    const { message, profileId } = data;
    if (!message) return;

    const userId = socket.data.userId;
    const aiBotId = profileId || "ai_bot";

    try {
      // Save user's message (receiver = AI bot)
      await Message.create({ sender: userId, receiver: aiBotId, message });

      socket.emit("receive_message", {
        sender: userId,
        receiver: aiBotId,
        message,
      });

      // Generate AI reply using Grok
      try {
        // Load AI profile if profileId provided
        let aiPersona = "You are a friendly AI assistant in a dating app. Be warm, engaging, and supportive.";

        if (profileId && profileId !== "ai_bot") {
          const profile = await AIProfile.findOne({
            profileId,
            profileType: 'ai',
            isActive: true,
          });

          if (profile) {
            aiPersona = buildEnhancedPersona(profile, message, []);
          }
        }

        // Get recent conversation history
        const recentMessages = await Message.find({
          $or: [
            { sender: userId, receiver: aiBotId },
            { sender: aiBotId, receiver: userId },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(10)
          .lean();

        // Build conversation context
        const conversationHistory: LLMMessage[] = recentMessages
          .reverse()
          .map((msg: any) => ({
            role: msg.sender === userId ? 'user' : 'assistant',
            content: msg.message,
          }));

        // Generate AI response
        const llmMessages: LLMMessage[] = [
          { role: 'system', content: aiPersona },
          ...conversationHistory.slice(-8), // Last 8 messages for context
          { role: 'user', content: message },
        ];

        const aiReply = await callGrok(llmMessages);

        // Save AI reply (sender = AI bot, receiver = user)
        await Message.create({
          sender: aiBotId,
          receiver: userId,
          message: aiReply,
        });

        socket.emit("receive_message", {
          sender: aiBotId,
          receiver: userId,
          message: aiReply,
        });
      } catch (aiError) {
        console.error("AI generation error:", aiError);

        // Fallback response
        const fallbackReply = "I'm having trouble connecting right now. Could you try again?";

        await Message.create({
          sender: aiBotId,
          receiver: userId,
          message: fallbackReply,
        });

        socket.emit("receive_message", {
          sender: aiBotId,
          receiver: userId,
          message: fallbackReply,
        });
      }
    } catch (err) {
      console.error("Error saving message:", err);
      socket.emit("message_error", { message: "Failed to send message" });
    }
  });

  // Send conversation history with AI bot on demand
  socket.on("get_conversation", async (partnerId) => {
    if (!partnerId) return;

    try {
      const messages = await Message.find({
        $or: [
          { sender: socket.data.userId, receiver: partnerId },
          { sender: partnerId, receiver: socket.data.userId },
        ],
      })
        .sort({ createdAt: -1 })
        .limit(50)
        .lean();

      socket.emit("conversation", messages.reverse());
    } catch (err) {
      console.error("Error fetching conversation:", err);
    }
  });

  // ==================== VOICE CALL HANDLERS ====================

  // Start voice call
  socket.on('voice:start', async ({ profileId }) => {
    try {
      const userId = socket.data.userId;
      console.log(`📞 Starting call: User ${userId} → Profile ${profileId}`);

      // Load AI profile
      const profile = await AIProfile.findOne({
        profileId,
        profileType: 'ai',
        isActive: true,
        audienceSegment: 'for-men',
      });

      if (!profile) {
        sendVoiceError(socket, ErrorType.PROFILE_NOT_FOUND, 'AI profile not found or inactive');
        return;
      }

      // Get or create voice session
      let session = await VoiceSession.findOne({ userId, profileId });
      if (!session) {
        session = await VoiceSession.create({
          userId,
          profileId,
          messages: [],
        });
      }

      // Initialize audio buffer
      const audioBuffer = new AudioBuffer();
      const now = Date.now();

      // Store active call with all required properties
      const call: ActiveCall = {
        userId,
        profileId,
        audioBuffer,
        session,
        profile,
        isProcessing: false, // Processing lock
        isSaving: false, // Save lock
        startTime: now,
        lastActivityTime: now,
      };

      activeCalls.set(socket.id, call);

      // Setup call timeout (30 minutes)
      setupCallTimeout(socket.id, call);

      socket.emit('voice:ready', {
        profileName: profile.name,
        profileAvatar: profile.avatar,
      });

      console.log(`✅ Call ready: ${profile.name}`);
    } catch (error) {
      console.error('Error starting call:', error);
      sendVoiceError(socket, ErrorType.PROCESSING_ERROR, 'Failed to start call', error);
    }
  });

  // Receive audio chunks
  socket.on('voice:audio-chunk', async ({ audio, sampleRate }) => {
    try {
      const call = activeCalls.get(socket.id);
      if (!call) return;

      // Update last activity time
      call.lastActivityTime = Date.now();

      // Convert base64 to buffer
      const audioChunk = Buffer.from(audio, 'base64');
      call.audioBuffer.addChunk(audioChunk);

      // Check if user stopped speaking (silence detection)
      if (detectSilence(call.audioBuffer)) {
        // Check if already processing (prevent race condition)
        if (call.isProcessing) {
          console.log('⚠️ Already processing audio, skipping...');
          return;
        }

        // Check rate limiting (only when starting new processing)
        if (!checkRateLimit(call.userId)) {
          sendVoiceError(
            socket,
            ErrorType.RATE_LIMIT_EXCEEDED,
            'Too many requests. Please slow down.'
          );
          call.audioBuffer.clear(); // Clear buffer to prevent repeated errors
          return;
        }

        console.log('🔇 Silence detected, processing audio...');

        // Set processing lock
        call.isProcessing = true;

        // Get complete audio
        const completeAudio = call.audioBuffer.getAudio();
        call.audioBuffer.clear();

        // Process audio in background
        processUserAudio(socket, call, completeAudio, sampleRate)
          .finally(() => {
            // Release processing lock
            call.isProcessing = false;
          });
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
      const call = activeCalls.get(socket.id);
      if (call) {
        call.isProcessing = false; // Release lock on error
      }
    }
  });

  // User interrupts AI
  socket.on('voice:interrupt', () => {
    const call = activeCalls.get(socket.id);
    if (call) {
      call.audioBuffer.clear();
      console.log('⏹️ User interrupted AI');
    }
  });

  // End call
  socket.on('voice:end', async () => {
    const call = activeCalls.get(socket.id);
    if (call) {
      await cleanupCall(socket.id, call);
      socket.emit('voice:ended', { reason: 'user_ended' });
      console.log(`📴 Call ended by user: ${call.userId}`);
    }
  });

  socket.on("disconnect", async () => {
    const call = activeCalls.get(socket.id);
    if (call) {
      await cleanupCall(socket.id, call);
      console.log(`🔌 Voice call disconnected: ${call.userId}`);
    }
    console.log(`User disconnected: ${socket.data.userId}`);
  });
});

// ==================== VOICE PROCESSING FUNCTIONS ====================

// Process user audio and generate AI response
async function processUserAudio(
  socket: any,
  call: any,
  audioBuffer: Buffer,
  sampleRate: number
) {
  try {
    // 1. Transcribe with ElevenLabs STT
    const transcript = await transcribeAudio(audioBuffer, sampleRate);
    if (!transcript) {
      console.log('⚠️ Empty transcription');
      return;
    }

    console.log(`📝 User said: "${transcript}"`);

    // 2. Build enhanced persona prompt
    const recentMessages = call.session.messages.slice(-5).map((m: any) => m.content);
    const personaPrompt = buildEnhancedPersona(call.profile, transcript, recentMessages);

    // 3. Generate AI response with Grok-3 (optimized: last 5 messages only)
    const history = call.session.messages.slice(-5);
    const llmMessages = [
      { role: 'system', content: personaPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: 'user', content: transcript },
    ];

    const aiResponse = await callGrok(llmMessages);
    console.log(`💬 AI response: "${aiResponse}"`);

    // 4. Convert to speech with ElevenLabs TTS
    socket.emit('voice:ai-speaking');

    const voiceSettings = getVoiceSettings(call.profile);
    const audioBase64 = await synthesizeSpeech(aiResponse, voiceSettings);

    // 5. Send audio to client
    socket.emit('voice:ai-audio', { base64: audioBase64 });

    // 6. Save to session
    call.session.messages.push(
      { role: 'user', content: transcript, createdAt: new Date() },
      { role: 'assistant', content: aiResponse, createdAt: new Date() }
    );

    if (call.session.messages.length > 50) {
      call.session.messages = call.session.messages.slice(-50);
    }

    // Save with lock to prevent parallel saves
    if (!call.isSaving) {
      call.isSaving = true;
      try {
        await call.session.save();
      } finally {
        call.isSaving = false;
      }
    }
  } catch (error) {
    console.error('Error processing user audio:', error);
    socket.emit('voice:error', { message: 'Failed to process audio' });
  }
}

// Helper: Convert raw PCM to WAV format
function encodeWAV(samples: Buffer, sampleRate: number, numChannels: number = 1, bitsPerSample: number = 16): Buffer {
  const dataLength = samples.length;
  const buffer = Buffer.alloc(44 + dataLength);

  // WAV Header
  buffer.write('RIFF', 0);                                    // ChunkID
  buffer.writeUInt32LE(36 + dataLength, 4);                  // ChunkSize
  buffer.write('WAVE', 8);                                    // Format
  buffer.write('fmt ', 12);                                   // Subchunk1ID
  buffer.writeUInt32LE(16, 16);                              // Subchunk1Size (PCM)
  buffer.writeUInt16LE(1, 20);                               // AudioFormat (PCM)
  buffer.writeUInt16LE(numChannels, 22);                     // NumChannels
  buffer.writeUInt32LE(sampleRate, 24);                      // SampleRate
  buffer.writeUInt32LE(sampleRate * numChannels * bitsPerSample / 8, 28); // ByteRate
  buffer.writeUInt16LE(numChannels * bitsPerSample / 8, 32); // BlockAlign
  buffer.writeUInt16LE(bitsPerSample, 34);                   // BitsPerSample
  buffer.write('data', 36);                                   // Subchunk2ID
  buffer.writeUInt32LE(dataLength, 40);                      // Subchunk2Size

  // Copy audio data
  samples.copy(buffer, 44);

  return buffer;
}

// ElevenLabs STT
async function transcribeAudio(audioBuffer: Buffer, sampleRate: number): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY');

  // Convert raw PCM to proper WAV format
  const wavBuffer = encodeWAV(audioBuffer, sampleRate);

  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(wavBuffer)], { type: 'audio/wav' });
  formData.append('file', audioBlob, 'audio.wav');
  formData.append('model_id', process.env.ELEVENLABS_STT_MODEL_ID || 'scribe_v2');
  formData.append('language_code', 'en');

  const response = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
    method: 'POST',
    headers: { 'xi-api-key': apiKey },
    body: formData,
  });
  console.log(response)
  if (!response.ok) {
    throw new Error(`STT error: ${await response.text()}`);
  }

  const result = await response.json();
  return (result.text || result.transcription || '').trim();
}

// Grok LLM with Grok-3 model
async function callGrok(messages: { role: string; content: string }[]) {
  const apiKey = (process.env.GROK_API_KEY || '').trim().replace(/\.$/, '');
  if (!apiKey) throw new Error('Missing GROK_API_KEY');

  const response = await fetch('https://api.x.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'grok-3',
      temperature: 0.85,
      stream: false,
      max_tokens: 90,
      messages,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    console.error('❌ Grok API Error:', {
      status: response.status,
      statusText: response.statusText,
      error: payload
    });
    throw new Error(payload?.error?.message || `Grok request failed: ${response.status}`);
  }

  const choice = payload.choices?.[0]?.message;
  if (!choice) {
    console.error('❌ Empty Grok response:', payload);
    throw new Error('Empty Grok response');
  }

  if (Array.isArray(choice.content)) {
    return choice.content.map((c: any) => c.text || c).join('').trim();
  }

  return (choice.content || '').trim();
}

// ElevenLabs TTS
async function synthesizeSpeech(text: string, settings: any): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('Missing ELEVENLABS_API_KEY');

  const voiceId = settings.voiceId || process.env.ELEVENLABS_FEMALE_VOICE_ID;
  if (!voiceId) throw new Error('Missing voice ID');

  const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
    method: 'POST',
    headers: {
      'xi-api-key': apiKey,
      'Content-Type': 'application/json',
      accept: 'audio/mpeg',
    },
    body: JSON.stringify({
      text,
      model_id: settings.voiceModelId || 'eleven_multilingual_v2',
      voice_settings: {
        stability: settings.stability ?? 0.55,
        similarity_boost: settings.similarity ?? 0.75,
        style: settings.style ?? 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS error: ${await response.text()}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString('base64');
}

// Get voice settings for profile
function getVoiceSettings(profile: any) {
  const cardTitle = profile.cardTitle?.toLowerCase() || '';

  // Default settings
  let settings = {
    voiceId: profile.voiceId,
    voiceModelId: profile.voiceModelId,
    stability: 0.55,
    similarity: 0.75,
    style: 0.35,
  };

  // Personality-specific adjustments
  if (cardTitle.includes('introvert') || cardTitle.includes('shy')) {
    settings.stability = 0.70;
    settings.style = 0.20;
  } else if (cardTitle.includes('extrovert') || cardTitle.includes('energetic')) {
    settings.stability = 0.45;
    settings.style = 0.65;
  } else if (cardTitle.includes('bold') || cardTitle.includes('confident')) {
    settings.stability = 0.40;
    settings.style = 0.75;
  } else if (cardTitle.includes('seductive') || cardTitle.includes('flirty')) {
    settings.stability = 0.50;
    settings.style = 0.60;
  }

  return settings;
}

server.listen(PORT, () => {
  console.log(`🚀 Socket.io server (Chat + Voice) running on http://localhost:${PORT}`);
});
