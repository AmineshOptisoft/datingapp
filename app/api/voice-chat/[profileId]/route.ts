import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import AIProfile from "@/models/AIProfile";
import VoiceSession from "@/models/VoiceSession";
import { verifyToken } from "@/lib/auth";
import { buildPersonaPrompt } from "@/lib/voice-persona";

const ELEVEN_STT_URL = "https://api.elevenlabs.io/v1/speech-to-text";
const ELEVEN_TTS_URL = "https://api.elevenlabs.io/v1/text-to-speech";
const XAI_CHAT_URL = "https://api.x.ai/v1/chat/completions";

const MAX_CONTEXT_MESSAGES = 12;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ profileId: string }> }
) {
  try {
    const { profileId } = await params;

    const token = request.headers.get("authorization")?.replace("Bearer ", "");
    if (!token) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Invalid token" },
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const audioFile = formData.get("audio");

    if (!(audioFile instanceof File)) {
      return NextResponse.json(
        { success: false, message: "Audio blob is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const profile = await AIProfile.findOne({
      profileId,
      profileType: "ai",
      isActive: true,
    });

    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Profile not found" },
        { status: 404 }
      );
    }

    const isFemaleProfile = profile.audienceSegment === "for-men";
    const isVoiceEnabled =
      profile.realtimeVoiceEnabled ?? profile.audienceSegment === "for-men";

    if (!isFemaleProfile) {
      return NextResponse.json(
        {
          success: false,
          message: "Voice chat currently available for girl companions only",
        },
        { status: 403 }
      );
    }

    if (!isVoiceEnabled) {
      return NextResponse.json(
        { success: false, message: "Voice chat is not enabled for this profile yet" },
        { status: 403 }
      );
    }

    const voiceId =
      profile.voiceId || process.env.ELEVENLABS_FEMALE_VOICE_ID || null;
    if (!voiceId) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Missing ElevenLabs voice. Set profile.voiceId or ELEVENLABS_FEMALE_VOICE_ID.",
        },
        { status: 500 }
      );
    }

    const transcript = await transcribeAudio(
      audioFile,
      audioFile.name || "voice-input.webm",
      audioFile.type || "audio/webm"
    );

    if (!transcript) {
      return NextResponse.json(
        { success: false, message: "Unable to transcribe audio" },
        { status: 422 }
      );
    }

    const personaPrompt = buildPersonaPrompt(profile);

    const session =
      (await VoiceSession.findOne({
        userId: decoded.userId,
        profileId: profile.profileId,
      })) ||
      (await VoiceSession.create({
        userId: decoded.userId,
        profileId: profile.profileId,
        messages: [],
      }));

    const history = session.messages.slice(-MAX_CONTEXT_MESSAGES);
    const llmMessages = [
      { role: "system", content: personaPrompt },
      ...history.map((msg) => ({ role: msg.role, content: msg.content })),
      { role: "user", content: transcript },
    ];

    const aiReply = await callGrok(llmMessages);

    session.messages.push(
      { role: "user", content: transcript, createdAt: new Date() },
      { role: "assistant", content: aiReply, createdAt: new Date() }
    );

    if (session.messages.length > 2 * MAX_CONTEXT_MESSAGES) {
      session.messages = session.messages.slice(-2 * MAX_CONTEXT_MESSAGES);
    }

    await session.save();

    const audioBase64 = await synthesizeSpeech(aiReply, {
      voiceId,
      voiceModelId: profile.voiceModelId || process.env.ELEVENLABS_TTS_MODEL_ID,
      voiceStability: profile.voiceStability,
      voiceSimilarity: profile.voiceSimilarity,
      voiceStyle: profile.voiceStyle,
    });

    return NextResponse.json({
      success: true,
      userText: transcript,
      aiText: aiReply,
      audioBase64,
    });
  } catch (error) {
    console.error("[voice-chat] error", error);
    return NextResponse.json(
      {
        success: false,
        message: "Voice chat failed",
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}

async function transcribeAudio(
  audioFile: File,
  filename: string,
  mimeType: string
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) {
    throw new Error("Missing ELEVENLABS_API_KEY");
  }

  const sttForm = new FormData();
  sttForm.append("file", audioFile, filename);
  sttForm.append(
    "model_id",
    process.env.ELEVENLABS_STT_MODEL_ID || "eleven_multilingual_v2"
  );
  sttForm.append("language_code", "en");

  const response = await fetch(ELEVEN_STT_URL, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
    },
    body: sttForm,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs STT error: ${errorText}`);
  }

  const payload = await response.json();
  return (
    payload.text ||
    payload.transcription ||
    payload.transcript ||
    payload.data?.text ||
    ""
  ).trim();
}

async function callGrok(messages: { role: string; content: string }[]) {
  const apiKey = process.env.GROK_API_KEY;
  if (!apiKey) throw new Error("Missing GROK_API_KEY");

  const response = await fetch(XAI_CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "grok-3",
      temperature: 0.85,
      stream: false,
      messages,
    }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.error?.message || "Grok request failed");
  }

  const choice = payload.choices?.[0]?.message;

  if (!choice) {
    throw new Error("Grok returned empty response");
  }

  if (Array.isArray(choice.content)) {
    return choice.content
      .map((chunk: any) => {
        if (typeof chunk === "string") return chunk;
        if (typeof chunk?.text === "string") return chunk.text;
        return "";
      })
      .join("")
      .trim();
  }

  return (choice.content || "").trim();
}

async function synthesizeSpeech(
  text: string,
  options: {
    voiceId: string;
    voiceModelId?: string | null;
    voiceStability?: number | null;
    voiceSimilarity?: number | null;
    voiceStyle?: number | null;
  }
): Promise<string> {
  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error("Missing ELEVENLABS_API_KEY");

  const response = await fetch(`${ELEVEN_TTS_URL}/${options.voiceId}`, {
    method: "POST",
    headers: {
      "xi-api-key": apiKey,
      "Content-Type": "application/json",
      accept: "audio/mpeg",
    },
    body: JSON.stringify({
      text,
      model_id: options.voiceModelId || "eleven_monolingual_v1",
      voice_settings: {
        stability: options.voiceStability ?? 0.55,
        similarity_boost: options.voiceSimilarity ?? 0.75,
        style: options.voiceStyle ?? 0.35,
        use_speaker_boost: true,
      },
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`ElevenLabs TTS error: ${errorText}`);
  }

  const buffer = Buffer.from(await response.arrayBuffer());
  return buffer.toString("base64");
}

