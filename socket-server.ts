import http from "http";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "./models/Message";
import AIProfile from "./models/AIProfile";
import VoiceSession from "./models/VoiceSession";
import { buildEnhancedPersona } from "./lib/voice-persona-enhanced";
import { AudioBuffer, detectSilence } from "./lib/streaming-audio";

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

// Store active voice call sessions
const activeCalls = new Map<string, {
  userId: string
  profileId: string
  audioBuffer: AudioBuffer
  session: any
  profile: any
}>();

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
    const { message } = data;
    if (!message) return;

    const userId = socket.data.userId;
    const aiBotId = "ai_bot";

    try {
      // Save user's message (receiver = AI bot)
      await Message.create({ sender: userId, receiver: aiBotId, message });

      socket.emit("receive_message", {
        sender: userId,
        receiver: aiBotId,
        message,
      });

      // Simulate AI reply here (replace with real AI logic)
      const aiReply = `AI reply to: "${message}"`;

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
    } catch (err) {
      console.error("Error saving message:", err);
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
        socket.emit('voice:error', { message: 'Profile not found' });
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

      // Store active call
      activeCalls.set(socket.id, {
        userId,
        profileId,
        audioBuffer,
        session,
        profile,
      });

      socket.emit('voice:ready', {
        profileName: profile.name,
        profileAvatar: profile.avatar,
      });

      console.log(`✅ Call ready: ${profile.name}`);
    } catch (error) {
      console.error('Error starting call:', error);
      socket.emit('voice:error', { message: 'Failed to start call' });
    }
  });

  // Receive audio chunks
  socket.on('voice:audio-chunk', async ({ audio, sampleRate }) => {
    try {
      const call = activeCalls.get(socket.id);
      if (!call) return;

      // Convert base64 to buffer
      const audioChunk = Buffer.from(audio, 'base64');
      call.audioBuffer.addChunk(audioChunk);

      // Check if user stopped speaking (silence detection)
      if (detectSilence(call.audioBuffer)) {
        console.log('🔇 Silence detected, processing audio...');

        // Get complete audio
        const completeAudio = call.audioBuffer.getAudio();
        call.audioBuffer.clear();

        // Process audio in background
        processUserAudio(socket, call, completeAudio, sampleRate);
      }
    } catch (error) {
      console.error('Error processing audio chunk:', error);
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
      await call.session.save();
      activeCalls.delete(socket.id);
      console.log(`📴 Call ended: User ${call.userId}`);
    }
  });

  socket.on("disconnect", () => {
    const call = activeCalls.get(socket.id);
    if (call) {
      activeCalls.delete(socket.id);
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

    await call.session.save();
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
      max_tokens: 100,
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
      model_id: settings.voiceModelId || 'eleven_monolingual_v1',
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
