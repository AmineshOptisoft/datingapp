import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import { Types } from "mongoose";
import { verifyToken } from "@/lib/auth";

// Helper: extract and verify JWT from cookie or Bearer header
function authenticate(request: NextRequest) {
  let token = request.cookies.get("token")?.value;
  if (!token) {
    const authHeader = request.headers.get("authorization");
    token = authHeader?.replace("Bearer ", "");
  }
  if (!token) return null;
  return verifyToken(token);
}

// GET - Retrieve all characters for a user
export async function GET(request: NextRequest) {
  try {
    const decoded = authenticate(request);
    const { searchParams } = new URL(request.url);
    const requestedUserId = searchParams.get("userId");
    const lite = searchParams.get("lite");

    if (!requestedUserId) {
      return NextResponse.json(
        { success: false, message: "User ID is required" },
        { status: 400 }
      );
    }

    await dbConnect();

    const isLite = lite === "1" || lite === "true";

    // Determine if the requester is the owner
    const isOwner = decoded && decoded.userId === requestedUserId;

    // Check if the requester is an admin
    let isAdmin = false;
    if (decoded && decoded.userId) {
      const requestingUser = await User.findById(decoded.userId).select("role").lean();
      if (requestingUser && (requestingUser as any).role === "admin") {
        isAdmin = true;
      }
    }

    const user = await User.findById(requestedUserId)
      .select(
        isLite
          ? "characters._id characters.characterName characters.characterAge characters.language characters.tags characters.description characters.visibility"
          : "characters"
      )
      .lean();
    
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    let characters = (user as any).characters || [];

    // Security: Filter characters based on visibility if not the owner and not admin
    if (!isOwner && !isAdmin) {
      characters = characters.filter((char: any) => char.visibility === "public");
    }

    return NextResponse.json({
      success: true,
      data: characters,
    });
  } catch (error) {
    console.error("Get characters error:", error);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}

// POST - Create a new character
export async function POST(request: NextRequest) {
  try {
    // 🔐 Verify authentication
    const decoded = authenticate(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No valid token" },
        { status: 401 }
      );
    }

    // Support both FormData (with file upload) and JSON (with URL)
    const contentType = request.headers.get("content-type") || "";
    
    let userId: string, characterName: string, characterImage: string | null,
      characterVideo: string | null = null, characterThumbnail: string | null = null,
      characterAge: number, characterGender: string, language: string,
      tags: string[], description: string, personality: string,
      scenario: string, firstMessage: string, visibility: string;

    // Check if the requester is an admin (for target user support)
    await dbConnect();
    let isAdmin = false;
    const requestingUser = await User.findById(decoded.userId).select("role").lean();
    if (requestingUser && (requestingUser as any).role === "admin") {
      isAdmin = true;
    }

    if (contentType.includes("multipart/form-data")) {
      // FormData path — file upload support
      const formData = await request.formData();

      // Admin can specify a target userId, otherwise use own userId
      const formUserId = formData.get("userId") as string;
      userId = (isAdmin && formUserId) ? formUserId : decoded.userId;
      characterName = formData.get("characterName") as string;
      characterAge  = Number(formData.get("characterAge"));
      characterGender = formData.get("characterGender") as string;
      language      = (formData.get("language") as string) || "English";
      description   = formData.get("description") as string;
      personality   = formData.get("personality") as string;
      scenario      = (formData.get("scenario") as string) || "";
      firstMessage  = formData.get("firstMessage") as string;
      visibility    = (formData.get("visibility") as string) || "private";

      // tags may be sent as a comma-separated string or JSON array string
      const rawTags = formData.get("tags") as string | null;
      tags = rawTags
        ? rawTags.startsWith("[") ? JSON.parse(rawTags) : rawTags.split(",").map(t => t.trim())
        : [];

      // Handle image file upload
      const imageFile = formData.get("characterImage");
      
      // If imageFile is a File object with content
      if (imageFile instanceof File && imageFile.size > 0) {
        const path = await import("path");
        const fs   = await import("fs");

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext        = path.extname(imageFile.name) || ".jpg";
        const uniqueName = `char-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath   = path.join(uploadsDir, uniqueName);

        const arrayBuffer = await imageFile.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

        // Use the new dynamic upload API so Next.js doesn't 404 fresh files
        characterImage = `/api/uploads/${uniqueName}`;
      } else {
        // Allow passing a URL string directly via FormData (optional)
        characterImage = (formData.get("characterImageUrl") as string) || null;
      }

      // Handle video file upload
      const videoFile = formData.get("characterVideo");
      if (videoFile instanceof File && videoFile.size > 0) {
        const path = await import("path");
        const fs   = await import("fs");
        
        // Use require so typescript doesn't complain about types if not strictly defined
        const ffmpeg = require("fluent-ffmpeg");
        
        // Fix Next.js webpack breaking ffmpeg-static by pointing directly to node_modules
        let ffmpegPath;
        const defaultPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
        if (fs.existsSync(defaultPath)) {
            ffmpegPath = defaultPath;
        } else {
            // fallback for linux/mac if used anywhere else
            const os = require('os');
            const ext = os.platform() === 'win32' ? '.exe' : '';
            ffmpegPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg" + ext);
        }
        ffmpeg.setFfmpegPath(ffmpegPath);

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext = path.extname(videoFile.name) || ".mp4";
        const uniqueName = `char-vid-${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        const tempVideoPath = path.join(uploadsDir, `${uniqueName}-temp${ext}`);
        const finalVideoPath = path.join(uploadsDir, `${uniqueName}${ext}`);
        const thumbnailName = `${uniqueName}-thumb.jpg`;

        const arrayBuffer = await videoFile.arrayBuffer();
        fs.writeFileSync(tempVideoPath, Buffer.from(arrayBuffer));

        // Process video: trim to 5s max, compress by shrinking bitrate to remain under 500kb
        // targetting roughly ~600k bitrate max
        await new Promise((resolve, reject) => {
           ffmpeg(tempVideoPath)
             .duration(5)
             .videoBitrate('500k')
             .audioBitrate('64k')
             .size('?x480') // scale to height 480px, proportional width
             .output(finalVideoPath)
             .on('end', () => resolve(null))
             .on('error', (err: any) => reject(err))
             .run();
        });

        // Generate thumbnail exactly from the processed video
        await new Promise((resolve, reject) => {
           ffmpeg(finalVideoPath)
             .screenshots({
               timestamps: [0.5],
               filename: thumbnailName,
               folder: uploadsDir,
               size: '?x480'
             })
             .on('end', () => resolve(null))
             .on('error', (err: any) => reject(err))
             .on('filenames', function(filenames: string[]) {
               // Nothing strictly required here
             });
        });

        // Delete the temp file to save space
        if (fs.existsSync(tempVideoPath)) {
           fs.unlinkSync(tempVideoPath);
        }

        characterVideo = `/api/uploads/${uniqueName}${ext}`;
        characterThumbnail = `/api/uploads/${thumbnailName}`;
      } else {
        characterVideo = (formData.get("characterVideoUrl") as string) || null;
        characterThumbnail = (formData.get("characterThumbnailUrl") as string) || null;
      }

    } else {
      // JSON path — accepts a pre-uploaded URL (not base64)
      const body = await request.json();

      ({
        characterName, characterImage = null,
        characterVideo = null, characterThumbnail = null,
        characterAge, characterGender, language,
        tags, description, personality,
        scenario, firstMessage, visibility,
      } = body);
      // Admin can specify a target userId, otherwise use own userId
      userId = (isAdmin && body.userId) ? body.userId : decoded.userId;
    }

    // userId is set from JWT token, or target user if admin

    if (!characterName || characterName.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Character name is required" },
        { status: 400 }
      );
    }

    if (!characterAge && characterAge !== 0) {
      return NextResponse.json(
        { success: false, message: "Character age is required" },
        { status: 400 }
      );
    }

    if (!description || description.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Description is required" },
        { status: 400 }
      );
    }

    if (!personality || personality.trim() === "") {
      return NextResponse.json(
        { success: false, message: "Personality is required" },
        { status: 400 }
      );
    }

    // scenario is optional

    if (!firstMessage || firstMessage.trim() === "") {
      return NextResponse.json(
        { success: false, message: "First message is required" },
        { status: 400 }
      );
    }

    if (characterAge < 18) {
      return NextResponse.json(
        { success: false, message: "Character must be at least 18 years old" },
        { status: 400 }
      );
    }

    if (!characterGender || !["male", "female", "other"].includes(characterGender)) {
      return NextResponse.json(
        { success: false, message: "Valid character gender is required (male, female, or other)" },
        { status: 400 }
      );
    }

    if (tags && tags.length > 10) {
      return NextResponse.json(
        { success: false, message: "Cannot add more than 10 tags" },
        { status: 400 }
      );
    }

    // dbConnect already called above for admin check

    // Check if user already has 5 characters
    const existingUser = await User.findById(userId).select("characters");
    
    if (!existingUser) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    const characterCount = existingUser.characters?.length || 0;
    if (characterCount >= 5) {
      return NextResponse.json(
        { success: false, message: "Character limit reached. You can only create up to 5 characters." },
        { status: 400 }
      );
    }

    const newCharacter = {
      _id: new Types.ObjectId(),
      characterName,
      characterImage: characterImage || null,
      characterVideo: characterVideo || null,
      characterThumbnail: characterThumbnail || null,
      characterAge,
      characterGender,
      language: language || "English",
      tags: tags || [],
      description,
      personality,
      scenario: scenario || "",
      firstMessage,
      visibility: visibility || "private",
    };

    console.log("About to insert character for userId:", userId);

    const user = await User.findByIdAndUpdate(
      userId,
      { $push: { characters: newCharacter } },
      { new: true, runValidators: true }
    );

    console.log("Update result - User found:", !!user);
    if (user) {
      console.log("User characters count:", user.characters?.length || 0);
    }

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Note: Automatic 5 image generation via Grok was removed per user request.

    return NextResponse.json({
      success: true,
      message: "Character created successfully",
      data: newCharacter,
    }, { status: 201 });
  } catch (error: any) {
    console.error("Create character error:", error);
    
    // Handle validation errors
    if (error.name === "ValidationError") {
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
