"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/app/contexts/AuthContext";

interface VoiceChatPanelProps {
  profileId: string;
  profileName: string;
  cardTitle: string;
  enabled: boolean;
}

type ChatTurn = {
  role: "user" | "assistant";
  content: string;
};

export default function VoiceChatPanel({
  profileId,
  profileName,
  cardTitle,
  enabled,
}: VoiceChatPanelProps) {
  const { token, isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"idle" | "recording" | "processing">(
    "idle"
  );
  const [error, setError] = useState<string | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
        mediaRecorderRef.current.stream
          ?.getTracks()
          ?.forEach((track) => track.stop());
      }
    };
  }, []);

  const sendAudio = useCallback(
    async (audioBlob: Blob) => {
      if (!token) {
        setError("Missing auth token");
        setStatus("idle");
        return;
      }

      try {
        const formData = new FormData();
        formData.append("audio", audioBlob, "voice-input.webm");

        const response = await fetch(`/api/voice-chat/${profileId}`, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
          body: formData,
        });

        const payload = await response.json();

        if (!response.ok || !payload.success) {
          throw new Error(payload.message || "Voice chat failed");
        }

        setTurns((prev) => [
          ...prev,
          { role: "user", content: payload.userText },
          { role: "assistant", content: payload.aiText },
        ]);

        if (payload.audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${payload.audioBase64}`);
          void audio.play();
        }
      } catch (err) {
        console.error("voice chat error", err);
        setError(
          err instanceof Error ? err.message : "Unable to complete voice chat."
        );
      } finally {
        setStatus("idle");
      }
    },
    [profileId, token]
  );

  const startRecording = useCallback(async () => {
    setError(null);

    if (!enabled) {
      setError("Voice chat is not available for this profile yet.");
      return;
    }

    if (!isAuthenticated || !token) {
      setError("Login required before starting voice chat.");
      return;
    }

    if (!navigator.mediaDevices?.getUserMedia) {
      setError("Microphone access is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      chunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const audioBlob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        if (audioBlob.size > 0) {
          void sendAudio(audioBlob);
        } else {
          setStatus("idle");
        }
      };

      recorder.start();
      mediaRecorderRef.current = recorder;
      setStatus("recording");
    } catch (err) {
      console.error("mic error", err);
      setError("Microphone permission denied or unavailable.");
      setStatus("idle");
    }
  }, [enabled, isAuthenticated, token, sendAudio]);

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      setStatus("processing");
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
  }, []);

  const handlePressStart = () => {
    if (status === "idle") {
      void startRecording();
    }
  };

  const handlePressEnd = () => {
    if (status === "recording") {
      stopRecording();
    }
  };

  if (!enabled) {
    return (
      <div className="bg-zinc-900/40 border border-dashed border-white/20 rounded-2xl p-6 text-center text-zinc-400">
        Voice chat is coming soon for this profile.
      </div>
    );
  }

  return (
    <div className="bg-zinc-900/50 border border-white/10 rounded-2xl p-6 space-y-5">
      <div>
        <p className="text-sm uppercase tracking-wide text-purple-300">
          Realtime voice beta
        </p>
        <h3 className="text-2xl font-semibold text-white">
          Talk with {profileName} ({cardTitle})
        </h3>
        <p className="text-zinc-400 text-sm mt-1">
          Hold the mic button to speak. She listens and replies via ElevenLabs
          voice powered by Grok 3.
        </p>
      </div>

      <div className="h-48 rounded-2xl bg-black/30 border border-white/5 p-4 overflow-y-auto space-y-3">
        {turns.length === 0 && (
          <p className="text-center text-zinc-500 text-sm">
            No conversation yet. Tap the mic and say hello.
          </p>
        )}
        {turns.map((turn, idx) => (
          <div
            key={idx}
            className={`text-sm leading-relaxed ${
              turn.role === "user"
                ? "text-right text-white"
                : "text-left text-purple-200"
            }`}
          >
            <span className="block text-xs uppercase tracking-wide text-zinc-500">
              {turn.role === "user" ? "You" : profileName}
            </span>
            {turn.content}
          </div>
        ))}
      </div>

      {error && (
        <div className="text-sm text-amber-300 bg-amber-950/40 border border-amber-500/30 rounded-xl px-4 py-2">
          {error}
        </div>
      )}

      <div className="flex items-center justify-center">
        <button
          onMouseDown={(e) => {
            e.preventDefault();
            handlePressStart();
          }}
          onMouseUp={(e) => {
            e.preventDefault();
            handlePressEnd();
          }}
          onMouseLeave={() => {
            if (status === "recording") handlePressEnd();
          }}
          onTouchStart={(e) => {
            e.preventDefault();
            handlePressStart();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            handlePressEnd();
          }}
          onKeyDown={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              handlePressStart();
            }
          }}
          onKeyUp={(e) => {
            if (e.key === " " || e.key === "Enter") {
              e.preventDefault();
              handlePressEnd();
            }
          }}
          className={`w-24 h-24 rounded-full flex items-center justify-center text-white text-sm font-semibold transition-all ${
            status === "recording"
              ? "bg-red-600 shadow-[0_0_30px_rgba(248,113,113,0.7)]"
              : status === "processing"
              ? "bg-zinc-700 animate-pulse"
              : "bg-purple-600 hover:bg-purple-700"
          }`}
          disabled={status === "processing"}
        >
          {status === "recording"
            ? "Release"
            : status === "processing"
            ? "Thinking..."
            : "Hold to Talk"}
        </button>
      </div>

      {!isAuthenticated && (
        <p className="text-center text-xs text-zinc-500">
          Log in to unlock full-length voice chats.
        </p>
      )}
    </div>
  );
}

