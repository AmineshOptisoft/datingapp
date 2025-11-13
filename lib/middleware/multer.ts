// lib/middleware/multer.ts
import multer from "multer";
import path from "path";

// Configure multer storage in 'public/uploads'
const storage = multer.diskStorage({
  destination: path.join(process.cwd(), "public", "uploads"),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({ storage });

export default upload;
