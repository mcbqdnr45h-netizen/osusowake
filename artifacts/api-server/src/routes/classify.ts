import { Router, type IRouter } from "express";
import OpenAI from "openai";

const router: IRouter = Router();

const openai = new OpenAI({
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
  apiKey:  process.env.AI_INTEGRATIONS_OPENAI_API_KEY ?? "dummy",
});

const VALID_CATEGORIES = [
  { value: "bakery",      label: "パン"       },
  { value: "restaurant",  label: "お弁当・惣菜" },
  { value: "sweets",      label: "スイーツ"    },
  { value: "other",       label: "その他惣菜"  },
  { value: "cafe",        label: "カフェ"     },
  { value: "convenience", label: "コンビニ"   },
  { value: "supermarket", label: "スーパー"   },
  { value: "produce",     label: "野菜・果物" },
  { value: "meat",        label: "肉・魚"     },
  { value: "noodles",     label: "麺類"       },
  { value: "drinks",      label: "ドリンク"   },
];

/**
 * POST /api/suggest-category
 * body: { imageBase64: string }   (data URL or raw base64)
 * res:  { category: string | null }
 */
router.post("/suggest-category", async (req, res) => {
  try {
    const { imageBase64 } = req.body as { imageBase64?: string };
    if (!imageBase64) {
      res.status(400).json({ error: "bad_request", message: "imageBase64 is required" });
      return;
    }

    // data URL → raw base64 に変換
    const base64 = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;
    const mimeMatch = imageBase64.match(/^data:([^;]+);/);
    const mimeType  = (mimeMatch?.[1] ?? "image/jpeg") as "image/jpeg" | "image/png" | "image/gif" | "image/webp";

    const validList = VALID_CATEGORIES.map(c => `"${c.value}" (${c.label})`).join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini",
      max_completion_tokens: 20,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: { url: `data:${mimeType};base64,${base64}`, detail: "low" },
            },
            {
              type: "text",
              text: `この食べ物の画像を見て、以下のカテゴリーから最も適切なものを1つだけ英語のキーで答えてください。余計な説明は不要です。\n有効なカテゴリー: ${validList}\n答え:`,
            },
          ],
        },
      ],
    });

    const raw = (response.choices[0]?.message?.content ?? "").trim().toLowerCase().replace(/[^a-z_]/g, "");
    const matched = VALID_CATEGORIES.find(c => raw.includes(c.value));

    console.log(`[suggest-category] raw="${raw}" → category=${matched?.value ?? null}`);
    res.json({ category: matched?.value ?? null });
  } catch (err: any) {
    console.error("[suggest-category] error:", err?.message ?? err);
    res.status(500).json({ error: "internal_error", message: "Failed to classify image" });
  }
});

export default router;
