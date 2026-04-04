import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyToken } from "@/lib/auth";
import Report from "@/models/Report";
import User from "@/models/User";

export async function GET(req: NextRequest) {
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
    const admin = await User.findOne({ _id: decoded.userId, role: "admin" });
    if (!admin) {
      return NextResponse.json({ error: "Forbidden: Admins only" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const reports = await Report.find({})
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("reporterId", "name email role avatar")
      .lean();

    const populatedReports = await Promise.all(
      reports.map(async (report: any) => {
        let reportedProfile: { id: string; name: string;  avatar: string | null; email?: string } = { 
          id: report.reportedId, 
          name: "Unknown", 
          avatar: null 
        };
        try {
          const user: any = await User.findById(report.reportedId).select("name avatar email");
          if (user) {
            reportedProfile = { id: report.reportedId, name: user.name, avatar: user.avatar || null, email: user.email };
          } else {
            const userWithChar = await User.findOne(
              { "characters._id": report.reportedId },
              { "characters.$": 1 }
            );
            if (userWithChar && userWithChar.characters && userWithChar.characters.length > 0) {
              const char: any = userWithChar.characters[0];
              reportedProfile = { 
                id: report.reportedId, 
                name: char.characterName, 
                avatar: char.characterImage 
              };
            }
          }
        } catch (e) {}
        
        return {
          ...report,
          reportedProfile
        };
      })
    );

    const total = await Report.countDocuments({});

    return NextResponse.json({
      reports: populatedReports,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("Error fetching reports:", error);
    return NextResponse.json(
      { error: "Failed to fetch reports" },
      { status: 500 }
    );
  }
}
