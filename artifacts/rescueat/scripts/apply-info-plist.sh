#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Info.plist にプライバシー許可キーを確実に追加するスクリプト
#
# ★ なぜ必要か:
#   iOS は NSCameraUsageDescription が Info.plist に無いと、
#   <input type="file"> の "Take Photo" タップ時にアプリを silent-terminate する
#   （見た目はフリーズ）。NSPhotoLibraryUsageDescription も同様。
#
# 使用方法:
#   bash artifacts/rescueat/scripts/apply-info-plist.sh
#
# 実行環境: macOS（PlistBuddy が必要）
# 冪等性: 既存キーは上書き、無ければ追加
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESCUEAT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
PLIST="${RESCUEAT_DIR}/ios/App/App/Info.plist"
PB="/usr/libexec/PlistBuddy"

if [ ! -f "${PLIST}" ]; then
  echo "❌ Info.plist が見つかりません: ${PLIST}"
  echo "   先に 'npx cap add ios' を実行してください。"
  exit 1
fi

if [ ! -x "${PB}" ]; then
  echo "❌ PlistBuddy が見つかりません（Mac でのみ動作）。"
  exit 1
fi

echo "▶ Info.plist にプライバシー許可キーを適用中..."
echo "   ${PLIST}"

# upsert(key, value) — 既存なら set、無ければ add
upsert_string() {
  local key="$1"
  local value="$2"
  if "${PB}" -c "Print :${key}" "${PLIST}" >/dev/null 2>&1; then
    "${PB}" -c "Set :${key} ${value}" "${PLIST}"
    echo "   ✓ 更新: ${key}"
  else
    "${PB}" -c "Add :${key} string ${value}" "${PLIST}"
    echo "   + 追加: ${key}"
  fi
}

# ── プライバシー許可（カメラ・写真・位置情報） ───────────────────────────
upsert_string "NSCameraUsageDescription"           "店舗写真や本人確認書類の撮影に使用します。"
upsert_string "NSPhotoLibraryUsageDescription"     "店舗写真や本人確認書類の選択に使用します。"
upsert_string "NSPhotoLibraryAddUsageDescription"  "QRコードや受取チケットを写真ライブラリに保存します。"
upsert_string "NSLocationWhenInUseUsageDescription"          "近くのおすそわけ店舗を探すために現在地を使用します。"
upsert_string "NSLocationAlwaysAndWhenInUseUsageDescription" "近くのおすそわけ店舗を探すために現在地を使用します。"

echo ""
echo "✅ Info.plist 更新完了。次のステップ:"
echo "   1. npx cap sync ios"
echo "   2. Xcode で Product > Clean Build Folder (⇧⌘K)"
echo "   3. Xcode で実機にインストールし直し（古いビルドを削除）"
