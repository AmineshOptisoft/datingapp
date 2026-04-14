import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import { verifyAdmin } from "@/lib/adminAuth";
import NotificationSchedule from "@/models/NotificationSchedule";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    
    // Auth Check
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;

    // Since it's a singleton, we try to find one. If not found, we create a default one.
    let schedule = await NotificationSchedule.findOne({});
    
    if (!schedule) {
      schedule = await NotificationSchedule.create({});
    }

    return NextResponse.json({ success: true, schedule });
  } catch (error: any) {
    console.error("GET NotificationSchedule Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to fetch notification schedule" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    await dbConnect();
    
    // Auth Check
    const result = await verifyAdmin(request);
    if (result instanceof NextResponse) return result;
    const { adminUser } = result;

    const data = await request.json();

    // Use updateOne or findOneAndUpdate with upsert
    const updatedSchedule = await NotificationSchedule.findOneAndUpdate(
      {}, // Empty filter matches the first document it finds
      {
        $set: {
          ...data,
          updatedBy: adminUser._id
        }
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return NextResponse.json({ success: true, schedule: updatedSchedule });
  } catch (error: any) {
    console.error("PUT NotificationSchedule Error:", error);
    return NextResponse.json(
      { success: false, error: error.message || "Failed to update notification schedule" },
      { status: 500 }
    );
  }
}
