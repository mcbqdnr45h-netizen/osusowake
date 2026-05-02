/**
 * ニックネーム (display_name) バリデータ
 *
 * 目的: ランキング・口コミなど他ユーザーに表示される名前なので、
 *       下ネタ・差別語・なりすまし (運営/admin) などをブロックする。
 *
 * 注意:
 *   - 完璧なフィルターは存在しない。 主要パターンのみカバー。
 *   - クライアント側にも同等の実装あり (artifacts/rescueat/src/lib/nickname-validator.ts)。
 *     UX のため即時フィードバック用にコピーしてあるが、 サーバー側が SSOT (single source of truth)。
 */

export type NicknameValidationResult = { ok: true } | { ok: false; reason: string };

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

// 完全一致 NG (英・小文字化して比較)
const RESERVED_EXACT_LOWER = new Set([
  "guest", "admin", "administrator", "root", "official", "system", "support",
  "staff", "moderator", "mod", "owner", "operator", "test", "tester",
  "user", "users", "anonymous", "anon", "null", "undefined", "none",
  "rescueat", "osusowake", "おすそわけ運営",
]);

// 完全一致 NG (日本語そのまま)
const RESERVED_EXACT_JA = new Set([
  "ゲスト", "管理者", "管理人", "運営", "公式", "スタッフ", "モデレーター",
  "匿名", "名無し", "ななし", "テスト", "テストユーザー", "おすそわけ",
  "おすそわけ公式", "おすそわけ運営", "サポート", "お客様",
]);

// 部分一致 NG (含まれていたら NG)
//   - 性的, 排泄, 差別, 暴力, 自傷, ペド, なりすまし
const PROFANITY_CONTAINS = [
  // 性的 (ひらがな)
  "ちんこ", "ちんちん", "ちんぽ", "ちんぽこ", "ちんぽこ", "ちんぽ",
  "まんこ", "おまんこ", "おっぱい", "ぱいおつ", "せっくす", "ぺにす",
  "おなに", "おなにー", "せんずり", "しょうべん", "うんこ", "うんち",
  // 性的 (カタカナ)
  "チンコ", "チンチン", "チンポ", "マンコ", "オマンコ", "オッパイ", "パイオツ",
  "ペニス", "ヴァギナ", "セックス", "オナニー", "アナル", "ホモ", "レズ",
  "ヘンタイ", "エロ", "アダルト", "ポルノ", "ヌード", "ロリ", "ショタ",
  // 差別
  "チョン", "ちょん", "朝鮮人", "黒人", "ニガー", "カマ野郎", "知的障害",
  "きちがい", "キチガイ", "気違い", "土人", "部落",
  // 暴力・自傷
  "殺す", "ころす", "コロス", "死ね", "しね", "シネ", "自殺", "じさつ",
  "首吊り", "リストカット", "リスカ",
  // なりすまし
  "おすそわけ", "おすそ分け", "Osusowake", "OSUSOWAKE", "rescueat", "RescuEat", "RESCUEAT",
  "レスキュート", "レスキュー",
];

// 英単語 NG (単語境界で完全一致するもの。 部分一致だと "ass" が "class" にマッチするので避ける)
const PROFANITY_WORD_EN = new Set([
  "fuck", "fucking", "fucker", "fck", "shit", "shitty", "bitch", "biatch",
  "slut", "sluts", "whore", "whores", "asshole", "asshat", "ass", "arse",
  "dick", "dicks", "pussy", "pussies", "cock", "cocks", "cum", "cums",
  "nigger", "nigga", "niggers", "faggot", "fag", "retard", "retarded",
  "rape", "rapist", "raper", "rapeist", "kill", "die", "murder", "murderer",
  "sex", "sexy", "porn", "porno", "pornography", "xxx", "penis", "vagina",
  "vag", "boobs", "boob", "tits", "tit", "anal", "blowjob", "bj", "horny",
  "hentai", "loli", "lolicon", "shota", "shotacon", "pedo", "pedophile",
  "kys", "fml", "wtf", "stfu",
]);

/**
 * 表示名バリデーション。 通れば { ok: true }、 不可なら { ok: false, reason }。
 * UI には reason (日本語) をそのまま表示してよい。
 */
export function validateNickname(raw: unknown): NicknameValidationResult {
  if (typeof raw !== "string") {
    return { ok: false, reason: "ニックネームは文字列で入力してください" };
  }
  const trimmed = raw.trim();

  if (trimmed.length < NICKNAME_MIN) {
    return { ok: false, reason: `ニックネームは${NICKNAME_MIN}文字以上で入力してください` };
  }
  if (trimmed.length > NICKNAME_MAX) {
    return { ok: false, reason: `ニックネームは${NICKNAME_MAX}文字以内で入力してください` };
  }

  // 制御文字 / 不可視文字 (CJK の通常空白は許可)
  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2064]/.test(trimmed)) {
    return { ok: false, reason: "使用できない文字が含まれています" };
  }

  // 改行 NG
  if (/[\r\n\t]/.test(trimmed)) {
    return { ok: false, reason: "改行やタブは使用できません" };
  }

  // 連続空白 NG (3つ以上)
  if (/\s{3,}/.test(trimmed)) {
    return { ok: false, reason: "空白の連続は使用できません" };
  }

  // URL / メールアドレス NG
  if (/https?:\/\//i.test(trimmed) || /www\./i.test(trimmed)) {
    return { ok: false, reason: "URLは含められません" };
  }
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(trimmed)) {
    return { ok: false, reason: "メールアドレスは含められません" };
  }

  // 同じ文字の繰り返し NG (例: "aaaa", "ーーー")
  if (/^(.)\1+$/u.test(trimmed)) {
    return { ok: false, reason: "同じ文字の繰り返しは使用できません" };
  }

  const lower = trimmed.toLowerCase();

  // 予約語チェック (完全一致)
  if (RESERVED_EXACT_LOWER.has(lower) || RESERVED_EXACT_JA.has(trimmed)) {
    return { ok: false, reason: "このニックネームは使用できません" };
  }

  // 部分一致 NG (日本語下ネタなど)
  for (const w of PROFANITY_CONTAINS) {
    if (trimmed.includes(w)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
    const lw = w.toLowerCase();
    if (lw !== w && lower.includes(lw)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
  }

  // 英単語境界チェック (a-z0-9 連続を1単語として扱う)
  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (PROFANITY_WORD_EN.has(t)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
  }

  return { ok: true };
}

/** trim + 長さ調整して保存用の正規化文字列を返す。 バリデーション通過済み前提。 */
export function normalizeNickname(raw: string): string {
  return raw.trim().slice(0, NICKNAME_MAX);
}
