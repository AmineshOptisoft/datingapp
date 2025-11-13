import path from "path";
import multer from "multer";
import { createRouter } from "next-connect";

import dbConnect from "@/lib/db";
import User from "@/models/User";

export const runtime = "nodejs";

const storage = multer.diskStorage({
  destination: path.join(process.cwd(), "public", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `avatar-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

const router = createRouter();

router.use(upload.single("avatar") as any);

router.post(async (req: any, res: any) => {
  try {
    await dbConnect();

    const { userId, name, bio, email, phone } = req.body;

    if (!userId || !name || !email || !phone) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const updateData: any = { name, bio, email, phone };

    if (req.file) {
      updateData.avatar = `/uploads/${req.file.filename}`;
    }

    const updatedUser = await User.findByIdAndUpdate(userId, updateData, {
      new: true,
    });

    if (!updatedUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    return res
      .status(200)
      .json({ success: true, message: "Profile updated", data: updatedUser });
  } catch (error) {
    console.error("Profile update error:", error);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
});

export const POST = router.handler();
