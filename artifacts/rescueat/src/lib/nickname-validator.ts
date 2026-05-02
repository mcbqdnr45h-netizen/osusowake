/**
 * ニックネーム (display_name) バリデータ — クライアント側コピー
 *
 * 即時 UX フィードバック用。 サーバー側 (artifacts/api-server/src/lib/nickname-validator.ts) が
 * SSOT (single source of truth)。 二重チェックでセキュリティを担保。
 */

export type NicknameValidationResult = { ok: true } | { ok: false; reason: string };

export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 20;

const RESERVED_EXACT_LOWER = new Set([
  "guest", "admin", "administrator", "root", "official", "system", "support",
  "staff", "moderator", "mod", "owner", "operator", "test", "tester",
  "user", "users", "anonymous", "anon", "null", "undefined", "none",
  "rescueat", "osusowake", "おすそわけ運営",
]);

const RESERVED_EXACT_JA = new Set([
  "ゲスト", "管理者", "管理人", "運営", "公式", "スタッフ", "モデレーター",
  "匿名", "名無し", "ななし", "テスト", "テストユーザー", "おすそわけ",
  "おすそわけ公式", "おすそわけ運営", "サポート", "お客様",
]);

const PROFANITY_CONTAINS = [
  "ちんこ", "ちんちん", "ちんぽ", "ちんぽこ", "ちんぽこ", "ちんぽ",
  "まんこ", "おまんこ", "おっぱい", "ぱいおつ", "せっくす", "ぺにす",
  "おなに", "おなにー", "せんずり", "しょうべん", "うんこ", "うんち",
  "チンコ", "チンチン", "チンポ", "マンコ", "オマンコ", "オッパイ", "パイオツ",
  "ペニス", "ヴァギナ", "セックス", "オナニー", "アナル", "ホモ", "レズ",
  "ヘンタイ", "エロ", "アダルト", "ポルノ", "ヌード", "ロリ", "ショタ",
  "チョン", "ちょん", "朝鮮人", "黒人", "ニガー", "カマ野郎", "知的障害",
  "きちがい", "キチガイ", "気違い", "土人", "部落",
  "殺す", "ころす", "コロス", "死ね", "しね", "シネ", "自殺", "じさつ",
  "首吊り", "リストカット", "リスカ",
  "おすそわけ", "Osusowake", "OSUSOWAKE", "rescueat", "RescuEat", "RESCUEAT",
  "レスキュート", "レスキュー",
];

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

  // eslint-disable-next-line no-control-regex
  if (/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e\u2060-\u2064]/.test(trimmed)) {
    return { ok: false, reason: "使用できない文字が含まれています" };
  }
  if (/[\r\n\t]/.test(trimmed)) {
    return { ok: false, reason: "改行やタブは使用できません" };
  }
  if (/\s{3,}/.test(trimmed)) {
    return { ok: false, reason: "空白の連続は使用できません" };
  }
  if (/https?:\/\//i.test(trimmed) || /www\./i.test(trimmed)) {
    return { ok: false, reason: "URLは含められません" };
  }
  if (/[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/.test(trimmed)) {
    return { ok: false, reason: "メールアドレスは含められません" };
  }
  if (/^(.)\1+$/u.test(trimmed)) {
    return { ok: false, reason: "同じ文字の繰り返しは使用できません" };
  }

  const lower = trimmed.toLowerCase();

  if (RESERVED_EXACT_LOWER.has(lower) || RESERVED_EXACT_JA.has(trimmed)) {
    return { ok: false, reason: "このニックネームは使用できません" };
  }

  for (const w of PROFANITY_CONTAINS) {
    if (trimmed.includes(w)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
    const lw = w.toLowerCase();
    if (lw !== w && lower.includes(lw)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
  }

  const tokens = lower.split(/[^a-z0-9]+/).filter(Boolean);
  for (const t of tokens) {
    if (PROFANITY_WORD_EN.has(t)) {
      return { ok: false, reason: "不適切な表現が含まれています" };
    }
  }

  return { ok: true };
}

export function normalizeNickname(raw: string): string {
  return raw.trim().slice(0, NICKNAME_MAX);
}
