#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — ci_pre_xcodebuild.sh
# ビルド直前のチェック（実際のセットアップは ci_post_clone.sh で完了済み）
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [ci_pre_xcodebuild] ビルド直前チェック ==="

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESCUEAT_DIR="$(cd "${SCRIPT_DIR}/../.." && pwd)"

if [[ -d "${RESCUEAT_DIR}/../../dist-cap" ]] || [[ -d "${RESCUEAT_DIR}/dist-cap" ]]; then
  echo "✓ dist-cap が存在"
else
  echo "WARNING: dist-cap が見つかりません"
fi

echo "=== [ci_pre_xcodebuild] 完了 ==="
