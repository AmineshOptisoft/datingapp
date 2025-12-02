import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server as SocketIOServer } from "socket.io";
import dotenv from "dotenv";
import mongoose from "mongoose";
import Message from "./models/Message";
import AIProfile from "./models/AIProfile";
import VoiceSession from "./models/VoiceSession";
import { buildEnhancedPersona } from "./lib/voice-persona-enhanced";
import { 
  analyzeUserTone, 
  optimizeConversationContext, 
  extractUserMessages 
} from "./lib/chat-tone-analyzer";
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
  session: any;
  profile: any;
  isProcessing: boolean;
  isSaving: boolean;
  startTime: number;
  timeoutId?: NodeJS.Timeout;
  lastActivityTime: number;
}

interface LLMMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

enum ErrorType {
  PROFILE_NOT_FOUND = "PROFILE_NOT_FOUND",
  STT_FAILED = "STT_FAILED",
  LLM_FAILED = "LLM_FAILED",
  TTS_FAILED = "TTS_FAILED",
  PROCESSING_ERROR = "PROCESSING_ERROR",
  CALL_TIMEOUT = "CALL_TIMEOUT",
  RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED",
}

interface VoiceError {
  type: ErrorType;
  message: string;
  details?: any;
}

// ==================== CONFIGURATION ====================

dotenv.config({ path: ".env.local" });

const dev = process.env.NODE_ENV !== "production";
const hostname = "localhost";
const PORT = parseInt(process.env.PORT || "3000", 10);

const MONGO_URI =
  process.env.MONGODB_URI ||
  "mongodb+srv://nihal:nihal@cluster0.oz0lft4.mongodb.net/dating-app";

// ==================== CONSTANTS ====================

const CALL_TIMEOUT_MS = 30 * 60 * 1000;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 20;

// ==================== STATE MANAGEMENT ====================

const activeCalls = new Map<string, ActiveCall>();
const rateLimitMap = new Map<string, number[]>();

// ==================== HELPER FUNCTIONS ====================

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const userRequests = rateLimitMap.get(userId) || [];
  const recentRequests = userRequests.filter(
    (timestamp) => now - timestamp < RATE_LIMIT_WINDOW_MS
  );
  rateLimitMap.set(userId, recentRequests);
  if (recentRequests.length >= MAX_REQUESTS_PER_WINDOW) {
    return false;
  }
  recentRequests.push(now);
  rateLimitMap.set(userId, recentRequests);
  return true;
}

function setupCallTimeout(
  socketId: string,
  call: ActiveCall,
  io: SocketIOServer
): void {
  if (call.timeoutId) {
    clearTimeout(call.timeoutId);
  }
  call.timeoutId = setTimeout(() => {
    console.log(`⏰ Call timeout for user ${call.userId}`);
    const socket = io.sockets.sockets.get(socketId);
    if (socket) {
      socket.emit("voice:error", {
        type: ErrorType.CALL_TIMEOUT,
        message: "Call exceeded maximum duration (30 minutes)",
      });
      socket.emit("voice:ended", { reason: "timeout" });
    }
    cleanupCall(socketId, call);
  }, CALL_TIMEOUT_MS);
}

async function cleanupCall(socketId: string, call: ActiveCall): Promise<void> {
  try {
    if (call.timeoutId) {
      clearTimeout(call.timeoutId);
    }
    if (call.session && !call.isSaving) {
      call.isSaving = true;
      try {
        await call.session.save();
      } catch (saveError) {
        console.error("Error saving session:", saveError);
      } finally {
        call.isSaving = false;
      }
    }
    if (call.audioBuffer) {
      call.audioBuffer.clear();
    }
    activeCalls.delete(socketId);
    console.log(`🧹 Cleaned up call for user ${call.userId}`);
  } catch (error) {
    console.error("Error cleaning up call:", error);
  }
}

function sendVoiceError(
  socket: any,
  type: ErrorType,
  message: string,
  details?: any
): void {
  const error: VoiceError = { type, message, details };
  socket.emit("voice:error", error);
  console.error(`❌ ${type}: ${message}`, details || "");
}

// ==================== VOICE PROCESSING FUNCTIONS ====================

async function processUserAudio(
  socket: any,
  call: any,
  audioBuffer: Buffer,
  sampleRate: number
) {
  try {
    const transcript = await transcribeAudio(audioBuffer, sampleRate);
    if (!transcript) {
      console.log("⚠️ Empty transcription");
      return;
    }
    console.log(`📝 User said: "${transcript}"`);
    const recentMessages = call.session.messages
      .slice(-5)
      .map((m: any) => m.content);
    const personaPrompt = buildEnhancedPersona(
      call.profile,
      transcript,
      recentMessages
    );
    const history = call.session.messages.slice(-5);
    const llmMessages = [
      { role: "system", content: personaPrompt },
      ...history.map((m: any) => ({ role: m.role, content: m.content })),
      { role: "user", content: transcript },
    ];
    const aiResponse = await callGrok(llmMessages);
    console.log(`💬 AI response: "${aiResponse}"`);
    socket.emit("voice:ai-speaking");
    const voiceSettings = getVoiceSettings(call.profile);
    const audioBase64 = await synthesizeSpeech(aiResponse, voiceSettings);
    socket.emit("voice:ai-audio", { base64: audioBase64 });
    call.session.messages.push(
      { role: "user", content: transcript, createdAt: new Date() },
      { role: "assistant", content: aiResponse, createdAt: new Date() }
    );
    if (call.session.messages.length > 50) {
      call.session.messages = call.session.messages.slice(-50);
    }
    if (!call.isSaving) {
      call.isSaving = true;
      try {
        await call.session.save();
      } finally {
        call.isSaving = false;
      }
    }
  } catch (error) {
    console.error("Error processing user audio:", error);
    socket.emit("voice:error", { message: "Failed to process audio" });
  }
}

function encodeWAV(
  samples: Buffer,
  sampleRate: number,
  numChannels: number = 1,
  bitsPerSample: number = 16
): Buffer {
  const dataLength = samples.length;
  const buffer = Buffer.alloc(44 + dataLength);
  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataLength, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20);
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE((sampleRate * numChannels * bitsPerSample) / 8, 28);
  buffer.writeUInt16LE((numChannels * bitsPerSample) / 8, 32);
  buffer.writeUInt16LE(bitsPerSample, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataLength, 40);
  samples.copy(buffer, 44);
  return buffer;
}
// async function transcribeAudio(
//   audioBuffer: Buffer,
//   sampleRate: number
// ): Promise<string> {
//   try {
//     const apiKey = process.env.ELEVENLABS_API_KEY;
//     if (!apiKey) {
//       console.error("❌ Missing ELEVENLABS_API_KEY");
//       return "";
//     }

//     const wavBuffer = encodeWAV(audioBuffer, sampleRate);
//     const formData = new FormData();
//     const audioBlob = new Blob([new Uint8Array(wavBuffer)], {
//       type: "audio/wav",
//     });
//     formData.append("file", audioBlob, "audio.wav");
//     formData.append("model_id", "scribe_v2");
//     formData.append("language_code", "en");

//     const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
//       method: "POST",
//       headers: { "xi-api-key": apiKey },
//       body: formData,
//     });

//     if (!response.ok) {
//       const errorText = await response.text();
//       console.error(`❌ STT failed (${response.status}):`, errorText);

//       // Check for specific errors
//       try {
//         const errorData = JSON.parse(errorText);
//         if (errorData.detail?.status === "detected_unusual_activity") {
//           console.error("🚫 ElevenLabs Free Tier Blocked!");
//           console.error("👉 Upgrade at: https://elevenlabs.io/pricing");
//         }
//       } catch (e) {}

//       return ""; // Gracefully return empty instead of throwing
//     }

//     const result = await response.json();
//     return (result.text || result.transcription || "").trim();
//   } catch (error) {
//     console.error("❌ Exception in transcribeAudio:", error);
//     return "";
//   }
// }

async function transcribeAudio(
  audioBuffer: Buffer,
  sampleRate: number
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
  const wavBuffer = encodeWAV(audioBuffer, sampleRate);
  const formData = new FormData();
  const audioBlob = new Blob([new Uint8Array(wavBuffer)], {
    type: "audio/wav",
  });
  formData.append("file", audioBlob, "audio.wav");
  formData.append(
    "model_id",
    process.env.ELEVENLABS_STT_MODEL_ID || "scribe_v2"
  );
  formData.append("language_code", "en");
  const response = await fetch("https://api.elevenlabs.io/v1/speech-to-text", {
    method: "POST",
    headers: { "xi-api-key": apiKey },
    body: formData,
  });
  if (!response.ok) {
    throw new Error(`STT error: ${await response.text()}`);
  }
  const result = await response.json();
  return (result.text || result.transcription || "").trim();
}

async function callGrok(messages: { role: string; content: string }[]) {
  console.log("messages", messages);
  const apiKey = (process.env.GROK_API_KEY || "").trim().replace(/\.$/, "");
  if (!apiKey) throw new Error("Missing GROK_API_KEY");
  const response = await fetch("https://api.x.ai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3",
      temperature: 0.95,  // Increased for more creative/bold responses
      stream: false,
      max_tokens: 50,  // Reduced for shorter, more natural responses
      messages,
    }),
  });
  const payload = await response.json();
  if (!response.ok) {
    console.error("❌ Grok API Error:", {
      status: response.status,
      statusText: response.statusText,
      error: payload,
    });
    throw new Error(
      payload?.error?.message || `Grok request failed: ${response.status}`
    );
  }
  const choice = payload.choices?.[0]?.message;
  if (!choice) {
    console.error("❌ Empty Grok response:", payload);
    throw new Error("Empty Grok response");
  }
  if (Array.isArray(choice.content)) {
    return choice.content
      .map((c: any) => c.text || c)
      .join("")
      .trim();
  }
  return (choice.content || "").trim();
}

async function synthesizeSpeech(text: string, settings: any): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");
  const voiceId = settings.voiceId || process.env.ELEVENLABS_FEMALE_VOICE_ID;
  if (!voiceId) throw new Error("Missing voice ID");
  const response = await fetch(
    `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
    {
      method: "POST",
      headers: {
        "xi-api-key": apiKey,
        "Content-Type": "application/json",
        accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: settings.voiceModelId || "eleven_multilingual_v2",
        voice_settings: {
          stability: settings.stability ?? 0.55,
          similarity_boost: settings.similarity ?? 0.75,
          style: settings.style ?? 0.35,
          use_speaker_boost: true,
        },
      }),
    }
  );
  if (!response.ok) {
    throw new Error(`TTS error: ${await response.text()}`);
  }
  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

function getVoiceSettings(profile: any) {
  const cardTitle = profile.cardTitle?.toLowerCase() || "";
  let settings = {
    voiceId: profile.voiceId,
    voiceModelId: profile.voiceModelId,
    stability: 0.55,
    similarity: 0.75,
    style: 0.35,
  };
  if (cardTitle.includes("introvert") || cardTitle.includes("shy")) {
    settings.stability = 0.7;
    settings.style = 0.2;
  } else if (
    cardTitle.includes("extrovert") ||
    cardTitle.includes("energetic")
  ) {
    settings.stability = 0.45;
    settings.style = 0.65;
  } else if (cardTitle.includes("bold") || cardTitle.includes("confident")) {
    settings.stability = 0.4;
    settings.style = 0.75;
  } else if (cardTitle.includes("seductive") || cardTitle.includes("flirty")) {
    settings.stability = 0.5;
    settings.style = 0.6;
  }
  return settings;
}

// ==================== INITIALIZE NEXT.JS APP ====================

const app = next({ dev, hostname, port: PORT });
const handle = app.getRequestHandler();

async function connectMongoDB() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log("✅ MongoDB connected");
  } catch (err) {
    console.error("❌ Mongo connection error:", err);
    process.exit(1);
  }
}

// ==================== START SERVER ====================

app.prepare().then(async () => {
  await connectMongoDB();

  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url!, true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = new SocketIOServer(server, {
    cors: {
      origin: `http://localhost:${PORT}`,
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use((socket, next) => {
    const userId = socket.handshake.auth.userId;
    if (!userId) return next(new Error("UserId required"));
    socket.data.userId = userId;
    next();
  });

  io.on("connection", (socket) => {
    console.log(`🔌 User connected: ${socket.data.userId}`);

    socket.on("send_message", async (data) => {
      const { message, profileId } = data;
      if (!message) return;
      const userId = socket.data.userId;
      const aiBotId = profileId || "ai_bot";
      try {
        await Message.create({ sender: userId, receiver: aiBotId, message });
        socket.emit("receive_message", {
          sender: userId,
          receiver: aiBotId,
          message,
        });
        try {
          // Fetch AI profile if specific profileId provided
          let profile = null;
          if (profileId && profileId !== "ai_bot") {
            profile = await AIProfile.findOne({
              profileId,
              profileType: "ai",
              isActive: true,
            });
          }

          // Fetch recent conversation history
          const recentMessages = await Message.find({
            $or: [
              { sender: userId, receiver: aiBotId },
              { sender: aiBotId, receiver: userId },
            ],
          })
            .sort({ createdAt: -1 })
            .limit(10)
            .lean();

          const conversationHistory: LLMMessage[] = recentMessages
            .reverse()
            .map((msg: any) => ({
              role: msg.sender === userId ? "user" : "assistant",
              content: msg.message,
            }));

          // Analyze user's tone from recent messages
          const userMessages = extractUserMessages(conversationHistory);
          const userTone = analyzeUserTone(userMessages);

          // Optimize context for token efficiency
          let systemPrompt: string;
          let optimizedHistory: LLMMessage[];

          if (profile) {
            const optimized = optimizeConversationContext(
              profile,
              message,
              conversationHistory,
              userTone
            );
            systemPrompt = optimized.systemPrompt;
            optimizedHistory = optimized.conversationHistory as LLMMessage[];
            console.log(`💡 Token estimate: ${optimized.tokenEstimate} | User tone: ${userTone.style}`);
          } else {
            systemPrompt = "You are a friendly AI assistant in a dating app. Be warm, engaging, and supportive.";
            optimizedHistory = conversationHistory.slice(-6) as LLMMessage[];
          }

          // Build Grok API messages
          const llmMessages: LLMMessage[] = [
            { role: "system", content: systemPrompt },
            ...optimizedHistory,
            { role: "user", content: message },
          ];

          const aiReply = await callGrok(llmMessages);
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
          const fallbackReply =
            "I'm having trouble connecting right now. Could you try again?";
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

    socket.on("voice:start", async ({ profileId }) => {
      try {
        const userId = socket.data.userId;
        console.log(`📞 Starting call: User ${userId} → Profile ${profileId}`);
        const profile = await AIProfile.findOne({
          profileId,
          profileType: "ai",
          isActive: true,
          audienceSegment: "for-men",
        });
        if (!profile) {
          sendVoiceError(
            socket,
            ErrorType.PROFILE_NOT_FOUND,
            "AI profile not found or inactive"
          );
          return;
        }
        let session = await VoiceSession.findOne({ userId, profileId });
        if (!session) {
          session = await VoiceSession.create({
            userId,
            profileId,
            messages: [],
          });
        }
        const audioBuffer = new AudioBuffer();
        const now = Date.now();
        const call: ActiveCall = {
          userId,
          profileId,
          audioBuffer,
          session,
          profile,
          isProcessing: false,
          isSaving: false,
          startTime: now,
          lastActivityTime: now,
        };
        activeCalls.set(socket.id, call);
        setupCallTimeout(socket.id, call, io);
        socket.emit("voice:ready", {
          profileName: profile.name,
          profileAvatar: profile.avatar,
        });
        console.log(`✅ Call ready: ${profile.name}`);
      } catch (error) {
        console.error("Error starting call:", error);
        sendVoiceError(
          socket,
          ErrorType.PROCESSING_ERROR,
          "Failed to start call",
          error
        );
      }
    });

    socket.on("voice:audio-chunk", async ({ audio, sampleRate }) => {
      try {
        const call = activeCalls.get(socket.id);
        if (!call) return;
        call.lastActivityTime = Date.now();
        const audioChunk = Buffer.from(audio, "base64");
        call.audioBuffer.addChunk(audioChunk);
        if (detectSilence(call.audioBuffer)) {
          if (call.isProcessing) {
            console.log("⚠️ Already processing audio, skipping...");
            return;
          }
          if (!checkRateLimit(call.userId)) {
            sendVoiceError(
              socket,
              ErrorType.RATE_LIMIT_EXCEEDED,
              "Too many requests. Please slow down."
            );
            call.audioBuffer.clear();
            return;
          }
          console.log("🔇 Silence detected, processing audio...");
          call.isProcessing = true;
          const completeAudio = call.audioBuffer.getAudio();
          call.audioBuffer.clear();
          processUserAudio(socket, call, completeAudio, sampleRate).finally(
            () => {
              call.isProcessing = false;
            }
          );
        }
      } catch (error) {
        console.error("Error processing audio chunk:", error);
        const call = activeCalls.get(socket.id);
        if (call) {
          call.isProcessing = false;
        }
      }
    });

    socket.on("voice:interrupt", () => {
      const call = activeCalls.get(socket.id);
      if (call) {
        call.audioBuffer.clear();
        console.log("⏹️ User interrupted AI");
      }
    });

    socket.on("voice:end", async () => {
      const call = activeCalls.get(socket.id);
      if (call) {
        await cleanupCall(socket.id, call);
        socket.emit("voice:ended", { reason: "user_ended" });
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

  server.listen(PORT, () => {
    console.log(
      `🚀 Next.js + Socket.io server running on http://localhost:${PORT}`
    );
  });
});
