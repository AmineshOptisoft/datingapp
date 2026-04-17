import { NextRequest, NextResponse } from "next/server";
import connectToDatabase from "@/lib/db";
import User from "@/models/User";
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

// GET - Fetch single character by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const decoded = authenticate(request);
    await connectToDatabase();
    const { id } = params;

    // Find user with the character
    const user = await User.findOne({ "characters._id": id }).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    const character = (user as any).characters.find((c: any) => c._id.toString() === id);

    if (!character) {
      return NextResponse.json(
        { success: false, message: "Character not found" },
        { status: 404 }
      );
    }

    // Security: If character is private, only owner can view
    const isOwner = decoded && decoded.userId === user._id.toString();
    if (character.visibility === "private" && !isOwner) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - This character is private" },
        { status: 403 }
      );
    }

    return NextResponse.json({ success: true, character });
  } catch (error) {
    console.error("Error fetching character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch character" },
      { status: 500 }
    );
  }
}

// PUT - Update character
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Verify authentication
    const decoded = authenticate(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No valid token" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = params;
    
    // Support both FormData and JSON
    // Always try FormData first, avoiding unreliable Content-Type header checks from React Native
    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch {
      // JSON fallback will trigger below
    }
    
    let userId: string, characterName: string, characterImage: string | null | undefined,
      characterVideo: string | null | undefined, characterThumbnail: string | null | undefined,
      characterAge: number, characterGender: string, language: string,
      tags: string[], description: string, personality: string,
      scenario: string, firstMessage: string, visibility: string;

    if (formData) {
      userId        = decoded.userId;
      characterName = formData.get("characterName") as string;
      characterAge  = Number(formData.get("characterAge"));
      characterGender = formData.get("characterGender") as string;
      language      = (formData.get("language") as string) || "English";
      description   = formData.get("description") as string;
      personality   = formData.get("personality") as string;
      scenario      = (formData.get("scenario") as string) || "";
      firstMessage  = formData.get("firstMessage") as string;
      visibility    = (formData.get("visibility") as string) || "private";

      const rawTags = formData.get("tags") as string | null;
      tags = rawTags
        ? rawTags.startsWith("[") ? JSON.parse(rawTags) : rawTags.split(",").map(t => t.trim())
        : [];

      // Handle image file upload for updates
      const imageFile = formData.get("characterImage") as File | null;
      if (imageFile && imageFile.size > 0) {
        const path = await import("path");
        const fs   = await import("fs");

        const uploadsDir = path.join(process.cwd(), "public", "uploads");
        if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

        const ext        = path.extname(imageFile.name) || ".jpg";
        const uniqueName = `char-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
        const filePath   = path.join(uploadsDir, uniqueName);

        const arrayBuffer = await imageFile.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(arrayBuffer));

        characterImage = `/api/uploads/${uniqueName}`;
      } else {
        characterImage = undefined; // Do not overwrite if no new image provided
      }

      // Handle video file upload for updates
      const videoFile = formData.get("characterVideo") as File | null;
      if (videoFile && videoFile.size > 0) {
        const path = await import("path");
        const fs   = await import("fs");
        const ffmpeg = require("fluent-ffmpeg");
        
        let ffmpegPath;
        const defaultPath = path.join(process.cwd(), "node_modules", "ffmpeg-static", "ffmpeg.exe");
        if (fs.existsSync(defaultPath)) {
            ffmpegPath = defaultPath;
        } else {
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

        await new Promise((resolve, reject) => {
           ffmpeg(tempVideoPath)
             .duration(5)
             .videoBitrate('500k')
             .audioBitrate('64k')
             .size('?x480')
             .output(finalVideoPath)
             .on('end', () => resolve(null))
             .on('error', (err: any) => reject(err))
             .run();
        });

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
             });
        });

        if (fs.existsSync(tempVideoPath)) {
           fs.unlinkSync(tempVideoPath);
        }

        characterVideo = `/api/uploads/${uniqueName}${ext}`;
        characterThumbnail = `/api/uploads/${thumbnailName}`;
      } else if (!formData.has("characterVideoUrl")) {
        // Explicitly cleared
        characterVideo = null;
        characterThumbnail = null;
      } else {
        characterVideo = undefined; // Do not overwrite
        characterThumbnail = undefined;
      }
    } else {
      const body = await request.json();
      ({
        characterName, characterImage,
        characterVideo, characterThumbnail,
        characterAge, characterGender, language,
        tags, description, personality,
        scenario, firstMessage, visibility,
      } = body);
      userId = decoded.userId;
    }

    console.log("📥 Received character update data:", { characterName, characterAge, characterGender, visibility });

    // userId is always derived from JWT token

    if (!characterName || characterName.trim().length === 0) {
      return NextResponse.json(
        { success: false, message: "Character name is required" },
        { status: 400 }
      );
    }

    if (!characterAge || characterAge < 18) {
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

    if (!description || !personality || !scenario || !firstMessage) {
      return NextResponse.json(
        { success: false, message: "All fields are required" },
        { status: 400 }
      );
    }

    // Check if the requester is an admin
    const requestingUser = await User.findById(decoded.userId).select("role").lean();
    const isAdmin = requestingUser && (requestingUser as any).role === "admin";

    if (isAdmin) {
      // Find the actual user who owns this character
      const ownerUser = await User.findOne({ "characters._id": id }).select("_id").lean();
      if (ownerUser) {
        userId = (ownerUser as any)._id.toString();
      }
    }

    // Find user with the character and verify ownership
    const user = await User.findOne({ _id: userId, "characters._id": id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found or unauthorized" },
        { status: 404 }
      );
    }

    // Prepare update object dynamically to not overwrite image if not provided
    const setQuery: any = {
      "characters.$.characterName": characterName.trim(),
      "characters.$.characterAge": characterAge,
      "characters.$.characterGender": characterGender,
      "characters.$.language": language,
      "characters.$.tags": tags || [],
      "characters.$.description": description.trim(),
      "characters.$.personality": personality.trim(),
      "characters.$.scenario": scenario.trim(),
      "characters.$.firstMessage": firstMessage.trim(),
      "characters.$.visibility": visibility || "private",
    };

    if (characterImage !== undefined) {
      setQuery["characters.$.characterImage"] = characterImage;
    }

    if (characterVideo !== undefined) {
      setQuery["characters.$.characterVideo"] = characterVideo;
      setQuery["characters.$.characterThumbnail"] = characterThumbnail;
    }

    // Update the character within the user's characters array
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, "characters._id": id },
      { $set: setQuery },
      { new: true, runValidators: true }
    );

    if (!updatedUser) {
      return NextResponse.json(
        { success: false, message: "Failed to update character" },
        { status: 500 }
      );
    }

    // Find the updated character to return
    const updatedCharacter = updatedUser.characters?.find((c: any) => c._id.toString() === id);

    return NextResponse.json({
      success: true,
      message: "Character updated successfully",
      character: updatedCharacter,
    });
  } catch (error) {
    console.error("Error updating character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update character" },
      { status: 500 }
    );
  }
}

// DELETE - Delete character
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔐 Verify authentication
    const decoded = authenticate(request);
    if (!decoded) {
      return NextResponse.json(
        { success: false, message: "Unauthorized - No valid token" },
        { status: 401 }
      );
    }

    await connectToDatabase();
    const { id } = params;

    // Check if the requester is an admin
    const requestingUser = await User.findById(decoded.userId).select("role").lean();
    const isAdmin = requestingUser && (requestingUser as any).role === "admin";

    // For admin: use userId from query param, or find the user who owns this character
    // For regular users: always use their own userId
    let userId = decoded.userId;
    if (isAdmin) {
      const { searchParams } = new URL(request.url);
      const queryUserId = searchParams.get("userId");
      if (queryUserId) {
        userId = queryUserId;
      } else {
        // Find user who owns this character
        const ownerUser = await User.findOne({ "characters._id": id }).select("_id").lean();
        if (ownerUser) {
          userId = (ownerUser as any)._id.toString();
        }
      }
    }

    // Find user with the character and verify ownership
    const user = await User.findOne({ _id: userId, "characters._id": id });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Character not found or unauthorized" },
        { status: 404 }
      );
    }

    // Remove character from the user's characters array
    await User.findByIdAndUpdate(
      userId,
      { $pull: { characters: { _id: id } } },
      { new: true }
    );

    return NextResponse.json({
      success: true,
      message: "Character deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting character:", error);
    return NextResponse.json(
      { success: false, message: "Failed to delete character" },
      { status: 500 }
    );
  }
}
