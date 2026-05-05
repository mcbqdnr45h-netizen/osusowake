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

/**
 * バイト先頭の magic number を検査して実体を判定する。
 * mimetype だけでは偽装可能（攻撃者が PHP/HTML を image/jpeg で送る）ため必須。
 * @returns 検出した正規の MIME。判定不能なら null。
 */
function detectImageMime(buf: Buffer): string | null {
  if (buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return "image/jpeg";
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47
   && buf[4] === 0x0d && buf[5] === 0x0a && buf[6] === 0x1a && buf[7] === 0x0a) return "image/png";
  // GIF: GIF87a / GIF89a
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38
   && (buf[4] === 0x37 || buf[4] === 0x39) && buf[5] === 0x61) return "image/gif";
  // WebP: "RIFF"....."WEBP"
  if (buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46
   && buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50) return "image/webp";
  return null;
}

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

// multer のエラー (fileFilter 拒否、サイズ超過 等) を JSON 4xx で返すラッパ。
// 標準では multer エラーは next(err) に流れて Express デフォルト HTML ハンドラに到達するため、
// クライアントで `res.json()` がパース失敗 → 「不明なエラー」となり原因特定不能になる問題を防ぐ。
const uploadSingleImage: import("express").RequestHandler = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (!err) return next();
    const isMulterErr = err instanceof multer.MulterError;
    const status = isMulterErr && err.code === "LIMIT_FILE_SIZE" ? 413 : 400;
    const message = isMulterErr
      ? (err.code === "LIMIT_FILE_SIZE"
          ? "ファイルサイズが上限 (10MB) を超えています"
          : `アップロード失敗: ${err.message}`)
      : (err instanceof Error ? err.message : "ファイル形式が不正です");
    console.warn("[upload] multer rejected:", { code: isMulterErr ? err.code : null, message });
    res.status(status).json({ error: "upload_rejected", message });
  });
};

router.post("/upload/bag-image", requireAuth, uploadSingleImage, async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "bad_request", message: "画像ファイルが必要です" });
      return;
    }

    // ── magic number 検証（実体バイト確認）──
    // mimetype は HTTP ヘッダなので攻撃者が任意に設定可能。実体を必ず確認する。
    const detectedMime = detectImageMime(req.file.buffer);
    if (!detectedMime) {
      res.status(400).json({ error: "invalid_image", message: "画像ファイルとして認識できません" });
      return;
    }
    if (!ALLOWED_MIME.has(detectedMime)) {
      res.status(400).json({ error: "unsupported_format", message: "対応形式は JPEG / PNG / WebP / GIF のみです" });
      return;
    }

    // 拡張子は magic number で検出した正規 MIME から決定（mimetype 偽装を完全無視）
    const ext = MIME_TO_EXT[detectedMime] ?? "jpg";
    // ファイル名にユーザID プレフィックスを付けて追跡可能に
    const userId = req.authUser!.id.replace(/[^a-z0-9-]/gi, "");
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabaseAdmin.storage
      .from("bag-images")
      .upload(fileName, req.file.buffer, {
        contentType: detectedMime,
        upsert: false,
        // ★ Egress 削減: 1年キャッシュ + immutable (ファイル名にタイムスタンプ含むため安全)
        cacheControl: "31536000, immutable",
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
