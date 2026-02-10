import { NextRequest, NextResponse } from "next/server";
import { verifyToken } from "@/lib/auth";

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

    // Get request body
    const body = await request.json();
    const { sceneTitle, prompt } = body;

    if (!prompt || prompt.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: "Prompt is required" },
        { status: 400 }
      );
    }

    // Combine scene title and prompt for better context
    const enhancedPrompt = sceneTitle
      ? `${sceneTitle}. ${prompt}`
      : prompt;

    console.log("🎨 Generating image with Grok:", enhancedPrompt);

    // Call Grok Image Generation API
    const grokApiKey = process.env.GROK_API_KEY;
    if (!grokApiKey) {
      console.error("❌ GROK_API_KEY not found in environment variables");
      return NextResponse.json(
        { success: false, error: "Server configuration error: API key missing" },
        { status: 500 }
      );
    }

    const grokResponse = await fetch("https://api.x.ai/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${grokApiKey}`,
      },
      body: JSON.stringify({
        model: "grok-2-image-1212",
        prompt: enhancedPrompt,
        n: 1, // Generate 1 image
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
        { success: false, error: "Failed to generate image" },
        { status: grokResponse.status }
      );
    }

    const grokData = await grokResponse.json();
    console.log("✅ Grok image generated successfully");

    // Extract image URL from response
    const imageUrl = grokData.data?.[0]?.url || grokData.url;

    if (!imageUrl) {
      console.error("❌ No image URL in Grok response:", grokData);
      return NextResponse.json(
        { success: false, error: "No image URL returned from API" },
        { status: 500 }
      );
    }

    // Save to MongoDB
    try {
      const dbConnect = (await import("@/lib/db")).default;
      const Scene = (await import("@/models/Scene")).default;
      
      await dbConnect();

      const savedScene = await Scene.create({
        userId: decoded.userId,
        sceneTitle: sceneTitle || "Untitled Scene",
        sceneDescription: prompt,
        mediaType: "image",
        mediaUrl: imageUrl,
      });

      console.log("💾 Scene saved to MongoDB:", savedScene._id);

      return NextResponse.json({
        success: true,
        imageUrl,
        sceneId: savedScene._id.toString(),
        sceneTitle,
        prompt,
      });
    } catch (dbError: any) {
      console.error("❌ Error saving scene to MongoDB:", dbError);
      // Still return the image URL even if DB save fails
      return NextResponse.json({
        success: true,
        imageUrl,
        sceneTitle,
        prompt,
        warning: "Image generated but failed to save to database",
      });
    }

  } catch (error: any) {
    console.error("❌ Error generating image:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message || "Internal server error",
      },
      { status: 500 }
    );
  }
}
