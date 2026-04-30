/**
 * 店舗の重複検出に使う正規化ヘルパ。
 * 「営業中の他人の店舗を勝手に登録する偽造」 を防ぐため、
 * 表記ゆれ (全角/半角・空白・大小・記号) を吸収して比較する。
 */

/** 全角英数記号 → 半角、 全角スペース → 半角スペース */
function toHalfWidth(s: string): string {
  return s.replace(/[Ａ-Ｚａ-ｚ０-９]/g, (ch) =>
    String.fromCharCode(ch.charCodeAt(0) - 0xfee0),
  ).replace(/\u3000/g, " ");
}

/**
 * 店名 / 住所などのテキストを比較用に正規化する。
 * - Unicode NFKC 正規化
 * - 全角→半角
 * - 大文字小文字統一
 * - 全空白・記号類除去（区切り表記の差を無視）
 */
export function normalizeForCompare(input: string | null | undefined): string {
  if (!input) return "";
  let s = input.normalize("NFKC");
  s = toHalfWidth(s);
  s = s.toLowerCase();
  // 空白 (半角/全角)、 ハイフン類、 ドット、 中黒、 カンマ、 スラッシュ、 括弧 等を除去
  s = s.replace(/[\s\-‐－―ー.,、。・/\\()（）「」『』【】\[\]{}<>＜＞:;:;'"`~!?！？*&%＄$#＃@＠+＋=＝]/g, "");
  return s.trim();
}

/**
 * 「店名 + 住所」 で同一店舗かどうかの正規化キーを生成する。
 * 異なるオーナが同じ実店舗を二重登録しているかの検出に使う。
 */
export function storeIdentityKey(name: string, address: string, city: string): string {
  return `${normalizeForCompare(name)}|${normalizeForCompare(city)}${normalizeForCompare(address)}`;
}
