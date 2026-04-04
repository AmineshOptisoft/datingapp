import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import jwt from "jsonwebtoken";

// ─── POST  /api/sharecount ─────────────────────────────────────────────────────
// Each call increments the authenticated user's shareCount by 1 and returns it.
export async function POST(request: NextRequest) {
  try {
    // ── Auth check ──────────────────────────────────────────────────────
    const authHeader = request.headers.get("authorization");
    const cookieToken = request.cookies.get("token")?.value;
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.split(" ")[1]
      : cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, message: "Authentication required" },
        { status: 401 }
      );
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    } catch {
      return NextResponse.json(
        { success: false, message: "Invalid or expired token" },
        { status: 401 }
      );
    }

    await dbConnect();

    // Atomically increment shareCount by 1 and return the updated doc
    const user = await User.findByIdAndUpdate(
      decoded.userId,
      { $inc: { shareCount: 1 } },
      { new: true, lean: true }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Share count updated",
      data: {
        shareCount: (user as any).shareCount ?? 1,
      },
    });
  } catch (error) {
    console.error("ShareCount error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update share count" },
      { status: 500 }
    );
  }
}

// ─── GET  /api/sharecount ──────────────────────────────────────────────────────
// Returns the current shareCount for the authenticated user.
// export async function GET(request: NextRequest) {
//   try {
//     const authHeader = request.headers.get("authorization");
//     const cookieToken = request.cookies.get("token")?.value;
//     const token = authHeader?.startsWith("Bearer ")
//       ? authHeader.split(" ")[1]
//       : cookieToken;

//     if (!token) {
//       return NextResponse.json(
//         { success: false, message: "Authentication required" },
//         { status: 401 }
//       );
//     }

//     let decoded: any;
//     try {
//       decoded = jwt.verify(token, process.env.JWT_SECRET as string);
//     } catch {
//       return NextResponse.json(
//         { success: false, message: "Invalid or expired token" },
//         { status: 401 }
//       );
//     }

//     await dbConnect();

//     const user = await User.findById(decoded.userId).select("shareCount");

//     if (!user) {
//       return NextResponse.json(
//         { success: false, message: "User not found" },
//         { status: 404 }
//       );
//     }

//     return NextResponse.json({
//       success: true,
//       data: {
//         shareCount: user.shareCount || 0,
//       },
//     });
//   } catch (error) {
//     console.error("ShareCount error:", error);
//     return NextResponse.json(
//       { success: false, message: "Failed to get share count" },
//       { status: 500 }
//     );
//   }
// }
