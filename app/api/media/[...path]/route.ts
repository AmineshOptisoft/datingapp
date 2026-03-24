import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import { promises as fsPromises } from "fs";
import path from "path";

const getMimeType = (ext: string) => {
  const mimeTypes: Record<string, string> = {
    '.mp4': 'video/mp4',
    '.webm': 'video/webm',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.png': 'image/png',
    '.gif': 'image/gif',
    '.webp': 'image/webp',
    '.svg': 'image/svg+xml',
    '.mp3': 'audio/mpeg',
    '.wav': 'audio/wav',
    '.ogg': 'audio/ogg'
  };
  return mimeTypes[ext.toLowerCase()] || 'application/octet-stream';
};

export async function GET(request: NextRequest, { params }: { params: { path: string[] } }) {
  try {
    // Construct safe absolute path targeting the public directory
    const filePath = path.join(process.cwd(), "public", ...params.path);
    
    // Prevent directory traversal attacks
    if (!filePath.startsWith(path.join(process.cwd(), "public"))) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 });
    }

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const range = request.headers.get("range");
    const ext = path.extname(filePath);
    const contentType = getMimeType(ext);

    // Handle partial range requests (Required for iOS Safari Video Player!)
    if (range && contentType.startsWith("video/")) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : stat.size - 1;
      const chunksize = (end - start) + 1;
      
      const fileHandle = await fsPromises.open(filePath, 'r');
      const chunk = Buffer.alloc(chunksize);
      await fileHandle.read(chunk, 0, chunksize, start);
      await fileHandle.close();

      const headers = {
        "Content-Range": `bytes ${start}-${end}/${stat.size}`,
        "Accept-Ranges": "bytes",
        "Content-Length": chunksize.toString(),
        "Content-Type": contentType,
      };
      
      return new NextResponse(chunk, {
        status: 206,
        headers,
      });
    } else {
      // Return full file for images/audio or non-range video requests
      const fileBuffer = fs.readFileSync(filePath);
      return new NextResponse(fileBuffer, {
        headers: {
          "Content-Length": stat.size.toString(),
          "Content-Type": contentType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    }
  } catch (error) {
    console.error("Media API error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
