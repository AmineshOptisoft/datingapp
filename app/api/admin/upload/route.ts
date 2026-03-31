import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/adminAuth";
import path from "path";
import fs from "fs";

// POST /api/admin/upload — Upload media file (image or video) for admin scene creation
export async function POST(request: NextRequest) {
  try {
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file || file.size === 0) {
      return NextResponse.json(
        { success: false, error: "No file provided" },
        { status: 400 }
      );
    }

    // Allow both image and video types for admin uploads
    const allowedImageTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    const allowedVideoTypes = ["video/mp4", "video/webm", "video/quicktime", "video/x-msvideo"];
    const allowedTypes = [...allowedImageTypes, ...allowedVideoTypes];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { success: false, error: "Invalid file type. Allowed: JPEG, PNG, WebP, GIF, MP4, WebM, MOV, AVI." },
        { status: 400 }
      );
    }

    // Max file size: 50MB for videos, 10MB for images
    const isVideo = allowedVideoTypes.includes(file.type);
    const maxSize = isVideo ? 50 * 1024 * 1024 : 10 * 1024 * 1024;

    if (file.size > maxSize) {
      return NextResponse.json(
        { success: false, error: `File too large. Max: ${isVideo ? "50MB" : "10MB"}` },
        { status: 400 }
      );
    }

    const uploadsDir = path.join(process.cwd(), "public", "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const ext = path.extname(file.name) || (isVideo ? ".mp4" : ".jpg");
    const uniqueName = `admin-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    const filePath = path.join(uploadsDir, uniqueName);

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    fs.writeFileSync(filePath, buffer);

    const fileUrl = `/api/media/uploads/${uniqueName}`;
    const mediaType = isVideo ? "video" : "image";

    console.log(`🛡️ Admin uploaded ${mediaType}: ${uniqueName} (${(file.size / 1024 / 1024).toFixed(2)}MB)`);

    return NextResponse.json({
      success: true,
      url: fileUrl,
      mediaType,
      fileName: uniqueName,
    });
  } catch (error: any) {
    console.error("❌ Admin upload error:", error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}
