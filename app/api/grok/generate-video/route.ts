import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";
import { videoGenerationLimiter } from "@/lib/rateLimit";

// In-memory storage for video generation requests (for demo purposes)
// In production, use Redis or database
const videoRequests = new Map<string, { 
  status: string; 
  videoUrl?: string; 
  error?: string;
  userId?: string;
  sceneTitle?: string;
  sceneDescription?: string;
  characterId?: string;
}>();

export async function POST(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Rate Limit Check (Phase 4 Security)
    if (!videoGenerationLimiter.isAllowed(decoded.userId)) {
      console.log(`⚠️ Rate limit hit for video generation: User ${decoded.userId}`);
      return NextResponse.json(
        { success: false, error: "Rate limit exceeded. Maximum 3 videos per minute." },
        { status: 429 }
      );
    }

    // Get request body
    const body = await request.json();
    const { sceneTitle, sceneDescription, characterId, duration = 10 } = body;

    if (!sceneDescription || sceneDescription.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Scene description is required" },
        { status: 400 }
      );
    }

    // Combine scene title and prompt for better context
    const enhancedPrompt = sceneTitle
      ? `${sceneTitle}. ${sceneDescription}`
      : sceneDescription;

    // Check wallet balance (25 coins for video)
    const VIDEO_COST = 25;
    const { WalletService } = await import("@/lib/walletService");
    
    const wallet = await WalletService.getWallet(decoded.userId);
    
    if (wallet.balance < VIDEO_COST) {
      return NextResponse.json(
        { 
          success: false, 
          error: "INSUFFICIENT_COINS",
          required: VIDEO_COST,
          balance: wallet.balance,
          message: `You need ${VIDEO_COST - wallet.balance} more coins to generate a video`
        },
        { status: 402 } // Payment Required
      );
    }

    console.log("🎬 Generating video with Grok:", enhancedPrompt);

    // Call Grok Video Generation API
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      console.error("❌ GROK_API_KEY not found in environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error: API key missing" },
        { status: 500 }
      );
    }

    const grokResponse = await fetch("https://api.x.ai/v1/videos/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-imagine-video", // Updated model name
        prompt: enhancedPrompt,
        duration: Math.min(duration, 10), // Max 10 seconds
      }),
    });

    if (!grokResponse.ok) {
      const errorData = await grokResponse.json().catch(() => ({}));
      console.error("❌ Grok API error:", grokResponse.status, errorData);
      
      // Handle specific error cases
      if (grokResponse.status === 429) {
        return NextResponse.json(
          { success: false, error: "Rate limit exceeded. Please try again later." },
          { status: 429 }
        );
      }
      
      if (grokResponse.status === 400) {
        return NextResponse.json(
          { success: false, error: "Invalid request or content policy violation" },
          { status: 400 }
        );
      }

      return NextResponse.json(
        { success: false, error: "Failed to start video generation" },
        { status: grokResponse.status }
      );
    }

    const grokData = await grokResponse.json();
    console.log("✅ Grok video generation started");

    // Extract request ID from response
    const requestId = grokData.id || grokData.request_id || grokData.requestId;

    if (!requestId) {
      console.error("❌ No request ID in Grok response:", grokData);
      return NextResponse.json(
        { success: false, error: "No request ID returned from API" },
        { status: 500 }
      );
    }

    // Store initial status WITH scene metadata for later saving to MongoDB
    videoRequests.set(requestId, { 
      status: "processing",
      userId: decoded.userId,
      sceneTitle: sceneTitle || "Untitled Video",
      sceneDescription: sceneDescription,
      characterId: characterId,
    });

    return NextResponse.json({
      success: true,
      requestId,
      status: "processing",
      sceneTitle,
      sceneDescription: sceneDescription,
    });

  } catch (error: any) {
    console.error("❌ Error starting video generation:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Verify authentication
    const authHeader = request.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "");

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - No token provided" },
        { status: 401 }
      );
    }

    const decoded = verifyToken(token);
    if (!decoded) {
      return NextResponse.json(
        { success: false, error: "Unauthorized - Invalid token" },
        { status: 401 }
      );
    }

    // Get request ID from query params
    const { searchParams } = new URL(request.url);
    const requestId = searchParams.get("requestId");

    if (!requestId) {
      return NextResponse.json(
        { success: false, error: "Request ID is required" },
        { status: 400 }
      );
    }

    console.log("🔍 Checking video status for request:", requestId);

    // Call Grok API to check status
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      return NextResponse.json(
        { success: false, error: "Server configuration error" },
        { status: 500 }
      );
    }

    const grokResponse = await fetch(`https://api.x.ai/v1/videos/${requestId}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${grokApiKey}`,
      },
    });

    if (!grokResponse.ok) {
      console.error("❌ Failed to check video status:", grokResponse.status);
      return NextResponse.json(
        { success: false, error: "Failed to check video status" },
        { status: grokResponse.status }
      );
    }

    const grokData = await grokResponse.json();
    
    // DEBUG: Log the full response to understand structure
    console.log("🔍 Full Grok response:", JSON.stringify(grokData, null, 2));
    
    // Determine status from Grok response
    // Check for error/failed states first
    const hasError = grokData.status === "failed" || grokData.status === "error" || !!grokData.error;
    const isComplete = !!grokData.video;
    const videoUrl = grokData.video?.url;
    
    // Set status based on API response
    let status: "completed" | "pending" | "failed" | "error";
    if (hasError) {
      status = grokData.status === "error" ? "error" : "failed";
    } else if (isComplete) {
      status = "completed";
    } else {
      status = "pending";
    }

    console.log(`📊 Video status: ${status}`, videoUrl ? `| Video URL: ${videoUrl}` : "");

    // Update in-memory storage
    if (isComplete && videoUrl) {
      const requestData = videoRequests.get(requestId);
      
      let finalVideoUrl = videoUrl;

      // Download the video to local storage before saving
      try {
        console.log("📥 Downloading generated video from Grok API...");
        const videoResponse = await fetch(videoUrl);
        if (videoResponse.ok) {
          const arrayBuffer = await videoResponse.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          
          const fs = await import("fs");
          const path = await import("path");
          
          const uploadsDir = path.join(process.cwd(), "public", "uploads");
          if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
          }

          const uniqueName = `grok-vid-${Date.now()}-${Math.round(Math.random() * 1e9)}.mp4`;
          const filePath = path.join(uploadsDir, uniqueName);
          
          fs.writeFileSync(filePath, buffer);
          finalVideoUrl = `/api/media/uploads/${uniqueName}`;
          console.log(`✅ Video saved locally: ${filePath}`);
        } else {
          console.error("❌ Failed to download Grok video. Using original URL.", videoResponse.statusText);
        }
      } catch (downloadError) {
        console.error("❌ Error downloading Grok video:", downloadError);
        // Continues with the original Grok URL as a fallback
      }

      videoRequests.set(requestId, { status: "completed", videoUrl: finalVideoUrl });
      
      // Save to MongoDB
      try {
        const dbConnect = (await import("@/lib/db")).default;
        const Scene = (await import("@/models/Scene")).default;
        
        await dbConnect();

        const savedScene = await Scene.create({
          userId: requestData?.userId || decoded.userId,
          sceneTitle: requestData?.sceneTitle || "Untitled Video",
          sceneDescription: requestData?.sceneDescription || "Generated video",
          mediaType: "video",
          mediaUrl: finalVideoUrl,
          characterId: requestData?.characterId || null,
        });

        console.log("💾 Video scene saved to MongoDB:", savedScene._id);

        // Deduct coins after successful video generation
        const VIDEO_COST = 25;
        const { WalletService: VideoWalletService } = await import("@/lib/walletService");
        await VideoWalletService.deductCoins({
          userId: requestData?.userId || decoded.userId,
          amount: VIDEO_COST,
          description: `Generated video: ${requestData?.sceneTitle || "Untitled Video"}`,
          mediaType: 'video',
          sceneId: savedScene._id.toString()
        });

        console.log(`💰 Deducted ${VIDEO_COST} coins for video generation`);

        return NextResponse.json({
          success: true,
          status: "completed",
          videoUrl: finalVideoUrl,
          sceneId: savedScene._id.toString(),
          sceneTitle: savedScene.sceneTitle,
          sceneDescription: savedScene.sceneDescription,
        });
      } catch (dbError: any) {
        console.error("❌ Error saving video scene to MongoDB:", dbError);
        // Still return video URL even if DB save fails
        return NextResponse.json({
          success: true,
          status: "completed",
          videoUrl: finalVideoUrl,
          warning: "Video generated but failed to save to database",
        });
      }
    } else if (status === "failed" || status === "error") {
      const errorMsg = grokData.error || "Video generation failed";
      videoRequests.set(requestId, { status: "failed", error: errorMsg });
      return NextResponse.json({
        success: false,
        status: "failed",
        error: errorMsg,
      });
    } else {
      // Still processing
      return NextResponse.json({
        success: true,
        status: "processing",
      });
    }

  } catch (error: any) {
    console.error("❌ Error checking video status:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
