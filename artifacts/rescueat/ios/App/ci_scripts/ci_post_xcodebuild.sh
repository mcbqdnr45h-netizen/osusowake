#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — ci_post_xcodebuild.sh
# ビルド成功/失敗後に実行されるクリーンアップ・通知スクリプト
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [ci_post_xcodebuild] ビルド後処理 ==="
echo "Build Number : ${CI_BUILD_NUMBER:-unknown}"
echo "Build Result : ${CI_BUILD_RESULT:-unknown}"

if [[ "${CI_BUILD_RESULT}" == "failed" ]]; then
  echo "⚠️ ビルドが失敗しました。Xcode Cloud ダッシュボードでログを確認してください。"
else
  echo "✅ ビルド成功: ${CI_PRODUCT_PLATFORM:-iOS} — ${CI_WORKFLOW:-unknown}"
fi

echo "=== [ci_post_xcodebuild] 完了 ==="
