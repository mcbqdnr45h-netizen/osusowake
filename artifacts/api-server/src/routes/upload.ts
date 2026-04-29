import { Router, type IRouter } from "express";
import multer from "multer";
import { supabaseAdmin } from "../lib/supabase.js";
import { requireAuth } from "../middlewares/auth.js";

const router: IRouter = Router();

// 許可する画像タイプ (拡張子インジェクション/任意ファイル配置を防ぐ)
const ALLOWED_MIME = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const MIME_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png":  "png",
  "image/webp": "webp",
  "image/gif":  "gif",
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024, files: 1 }, // 10MB / 1ファイルのみ
  fileFilter(_req, file, cb) {
    if (ALLOWED_MIME.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("対応形式は JPEG / PNG / WebP / GIF のみです"));
    }
  },
});

router.post("/upload/bag-image", requireAuth, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "bad_request", message: "画像ファイルが必要です" });
      return;
    }

    // 拡張子は許可リストから決定（mimetype を信頼しすぎない）
    const ext = MIME_TO_EXT[req.file.mimetype] ?? "jpg";
    // ファイル名にユーザID プレフィックスを付けて追跡可能に
    const userId = req.authUser!.id.replace(/[^a-z0-9-]/gi, "");
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

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
