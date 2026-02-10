"use client";

import { useState } from "react";
import { Image, Video, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface CreateSceneDialogProps {
  onSuccess: () => void;
  onClose: () => void;
}

export default function CreateSceneDialog({ onSuccess, onClose }: CreateSceneDialogProps) {
  const [unlockedStep, setUnlockedStep] = useState(1);
  const [sceneTitle, setSceneTitle] = useState("");
  const [sceneDescription, setSceneDescription] = useState("");
  const [outputType, setOutputType] = useState<"photo" | "video">("photo");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedMediaUrl, setGeneratedMediaUrl] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const step1Valid = sceneTitle.trim().length >= 3;
  const step2Valid = sceneDescription.trim().length >= 10;
  const canGenerate = unlockedStep >= 3 && step1Valid && step2Valid;

  const handleSubmitStep1 = () => {
    if (step1Valid) setUnlockedStep(2);
  };

  const handleSubmitStep2 = () => {
    if (step2Valid) setUnlockedStep(3);
  };

  const handleGenerate = async () => {
    if (!canGenerate) return;
    setIsGenerating(true);

    try {
      const token = localStorage.getItem("token");
      
      if (!token) {
        toast.error("Please login to generate scenes");
        return;
      }

      if (outputType === "photo") {
        // Image generation (synchronous)
        console.log("🎨 Generating image...");
        
        const response = await fetch("/api/grok/generate-image", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            sceneTitle,
            prompt: sceneDescription,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to generate image");
        }

        console.log("✅ Image generated:", data.imageUrl);
        toast.success("Image generated successfully! 🎨");
        
        // Display the generated image
        setGeneratedMediaUrl(data.imageUrl);
        setIsComplete(true);
        
        // Trigger gallery refresh when dialog closes
        onSuccess();
      } else {
        // Video generation (asynchronous)
        console.log("🎬 Starting video generation...");
        
        const response = await fetch("/api/grok/generate-video", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${token}`,
          },
          body: JSON.stringify({
            sceneTitle,
            prompt: sceneDescription,
            duration: 10,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || "Failed to start video generation");
        }

        console.log("⏳ Video generation started, polling...");
        toast.success("Video generation started! ⏳ This may take 30-60 seconds...");

        // Poll for video completion
        await pollVideoStatus(data.requestId, token);
        
        onSuccess();
      }
    } catch (error: any) {
      console.error("❌ Generate scene error:", error);
      toast.error(error.message || "Something went wrong. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  const pollVideoStatus = async (requestId: string, token: string) => {
    const maxAttempts = 60; // 5 minutes max (5s intervals)
    let attempts = 0;

    while (attempts < maxAttempts) {
      await new Promise((r) => setTimeout(r, 5000)); // Wait 5 seconds

      console.log(`🔍 Checking video status... (Attempt ${attempts + 1}/${maxAttempts})`);

      const response = await fetch(`/api/grok/generate-video?requestId=${requestId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await response.json();

      if (data.status === "completed") {
        console.log("✅ Video generated:", data.videoUrl);
        toast.success("Video generated successfully! 🎬");
        
        // Display the generated video
        setGeneratedMediaUrl(data.videoUrl);
        setIsComplete(true);
        
        return;
      } else if (data.status === "failed") {
        throw new Error(data.error || "Video generation failed");
      }

      attempts++;
    }

    throw new Error("Video generation timed out. Please try again.");
  };

  const progressPercent = (unlockedStep / 3) * 100;

  return (
    <div className="flex flex-col bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white rounded-2xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-xl max-w-md w-full max-h-[85vh]">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 dark:border-zinc-800 shrink-0">
        <h2 className="text-lg font-bold">Create imaginary scene</h2>
        <button
          onClick={onClose}
          className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-white hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          aria-label="Close"
        >
          ✕
        </button>
      </div>

      {/* Content - all in one frame, steps 2 & 3 blurred until unlocked */}
      <div className="p-4 space-y-6 overflow-y-auto flex-1 min-h-0">
        {/* Generated Media Preview */}
        {isComplete && generatedMediaUrl && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-700 rounded-2xl p-4 space-y-3">
            <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-bold">Generation Complete!</span>
            </div>
            
            {outputType === "photo" ? (
              <div className="space-y-2">
                <img 
                  src={generatedMediaUrl} 
                  alt="Generated scene" 
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
                />
                <div className="flex gap-2">
                  <a 
                    href={generatedMediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium text-center transition-all"
                  >
                    Open in New Tab
                  </a>
                  <a 
                    href={generatedMediaUrl} 
                    download
                    className="flex-1 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium text-center transition-all hover:opacity-90"
                  >
                    Download Image
                  </a>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <video 
                  src={generatedMediaUrl} 
                  controls 
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700"
                  autoPlay
                  loop
                />
                <div className="flex gap-2">
                  <a 
                    href={generatedMediaUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm font-medium text-center transition-all"
                  >
                    Open in New Tab
                  </a>
                  <a 
                    href={generatedMediaUrl} 
                    download
                    className="flex-1 px-3 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-medium text-center transition-all hover:opacity-90"
                  >
                    Download Video
                  </a>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 1. What scene are you thinking of? */}
        <div className="space-y-3">
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            What scene are you thinking of?
          </p>
          <div className="relative">
            <textarea
              value={sceneTitle}
              onChange={(e) => setSceneTitle(e.target.value)}
              placeholder="e.g. Sunset on a beach, Cozy cabin in the snow..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pb-10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all resize-none"
              rows={2}
              maxLength={100}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="text-xs text-zinc-500">{sceneTitle.length}/100</span>
              <button
                type="button"
                onClick={handleSubmitStep1}
                disabled={!step1Valid}
                className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* 2. Add description */}
        <div
          className={`space-y-3 transition-all duration-200 ${
            unlockedStep < 2 ? "pointer-events-none select-none opacity-60 blur-[2px]" : ""
          }`}
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Add a description
          </p>
          <div className="relative">
            <textarea
              value={sceneDescription}
              onChange={(e) => setSceneDescription(e.target.value)}
              placeholder="Describe the scene in detail: mood, characters, setting, lighting..."
              className="w-full bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 rounded-xl px-4 py-3 pb-10 text-zinc-900 dark:text-white placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-zinc-400 dark:focus:ring-zinc-500 transition-all resize-none"
              rows={4}
              maxLength={500}
            />
            <div className="absolute bottom-2 right-2 flex items-center gap-2">
              <span className="text-xs text-zinc-500">{sceneDescription.length}/500</span>
              <button
                type="button"
                onClick={handleSubmitStep2}
                disabled={!step2Valid}
                className="px-3 py-1.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-xs font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit
              </button>
            </div>
          </div>
        </div>

        {/* 3. Photo or Video */}
        <div
          className={`space-y-3 transition-all duration-200 ${
            unlockedStep < 3 ? "pointer-events-none select-none opacity-60 blur-[2px]" : ""
          }`}
        >
          <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
            Generate as photo or video?
          </p>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setOutputType("photo")}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${outputType === "photo"
                  ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                }
              `}
            >
              <Image className="w-8 h-8 text-zinc-700 dark:text-zinc-200" />
              <span className="text-sm font-medium">Photo</span>
            </button>
            <button
              type="button"
              onClick={() => setOutputType("video")}
              className={`
                flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all
                ${outputType === "video"
                  ? "border-zinc-900 dark:border-white bg-zinc-100 dark:bg-zinc-800"
                  : "border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800/50 hover:border-zinc-300 dark:hover:border-zinc-600"
                }
              `}
            >
              <Video className="w-8 h-8 text-zinc-700 dark:text-zinc-200" />
              <span className="text-sm font-medium">Video</span>
            </button>
          </div>
        </div>
      </div>

      {/* Line progress tracker - bottom */}
      <div className="px-4 py-3 bg-zinc-50 dark:bg-zinc-800/50 border-t border-zinc-200 dark:border-zinc-800 shrink-0">
        <div className="h-1.5 w-full bg-zinc-200 dark:bg-zinc-700 rounded-full overflow-hidden">
          <div
            className="h-full bg-zinc-900 dark:bg-white rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Footer actions */}
      <div className="flex items-center justify-between gap-3 p-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 shrink-0">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
        >
          {isComplete ? "Close" : "Cancel"}
        </button>

        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || isGenerating || isComplete}
          className="flex items-center gap-2 px-5 py-2 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-xl text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isGenerating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : outputType === "photo" ? (
            <>
              <Image className="w-4 h-4" />
              Generate photo
            </>
          ) : (
            <>
              <Video className="w-4 h-4" />
              Generate video
            </>
          )}
        </button>
      </div>
    </div>
  );
}
