import { Router, type IRouter } from "express";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabase.js";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter(_req, file, cb) {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("画像ファイルのみアップロードできます"));
    }
  },
});

router.post("/upload/bag-image", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "bad_request", message: "画像ファイルが必要です" });
      return;
    }

    const ext = req.file.mimetype.split("/")[1]?.replace("jpeg", "jpg") ?? "jpg";
    const fileName = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("bag-images")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: false,
      });

    if (error) {
      console.error("Storage upload error:", error);
      res.status(500).json({ error: "upload_failed", message: "アップロードに失敗しました" });
      return;
    }

    const { data: { publicUrl } } = supabaseAdmin.storage
      .from("bag-images")
      .getPublicUrl(fileName);

    res.json({ url: publicUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "internal_error", message: "アップロードに失敗しました" });
  }
});

export default router;
