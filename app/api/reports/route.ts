import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Report from "@/models/Report";
import User from "@/models/User";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const decoded = verifyToken(token);
    
    if (!decoded || !decoded.userId) {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 });
    }

    await dbConnect();
    const currentUser = await User.findById(decoded.userId);
    if (!currentUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { reportedId, reason } = body;

    if (!reportedId || !reason) {
      return NextResponse.json(
        { error: "reportedId and reason are required" },
        { status: 400 }
      );
    }

    // Resolve character ID to its owner User ID automatically.
    // Handles 3 formats:
    //   1. "character-<mongoId>"  → web app format
    //   2. plain "<mongoId>"      → native app passes character's raw _id
    //   3. valid User _id         → direct user report (no change needed)
    let finalReportedId = reportedId;

    if (typeof reportedId === "string" && reportedId.startsWith("character-")) {
      // Web format: strip prefix and find character owner
      const charId = reportedId.replace("character-", "");
      const owner = await User.findOne({ "characters._id": charId });
      if (!owner) {
        return NextResponse.json({ error: "Character owner not found" }, { status: 404 });
      }
      finalReportedId = owner._id;
    } else {
      // Check if the ID belongs to a real User first
      const isRealUser = await User.exists({ _id: reportedId }).catch(() => null);
      if (!isRealUser) {
        // Not a real user — try to find it as a character subdocument
        const owner = await User.findOne({ "characters._id": reportedId }).catch(() => null);
        if (owner) {
          finalReportedId = owner._id;
        }
        // If still not found, let it pass through — Report.create will fail with a cast error
        // which is caught below and returned as 500
      }
    }

    const newReport = await Report.create({
      reporterId: currentUser._id,
      reportedId: finalReportedId,
      reason,
      status: "pending",
    });

    return NextResponse.json(
      { message: "Report submitted successfully", report: newReport },
      { status: 201 }
    );
  } catch (error: any) {
    console.error("Error submitting report:", error);
    return NextResponse.json(
      { error: "Failed to submit report" },
      { status: 500 }
    );
  }
}
