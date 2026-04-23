#!/bin/bash
# ─────────────────────────────────────────────────────────────────────────────
# Osusowake iOS プロジェクト 初回セットアップスクリプト
# 使用方法: bash artifacts/rescueat/scripts/ios-setup.sh
# 実行環境: macOS + Xcode インストール済みであること
# ─────────────────────────────────────────────────────────────────────────────
set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
RESCUEAT_DIR="$(cd "${SCRIPT_DIR}/.." && pwd)"
REPO_ROOT="$(cd "${RESCUEAT_DIR}/../.." && pwd)"

echo "============================================================"
echo "  Osusowake iOS セットアップ"
echo "  Bundle ID: com.yuhi.osusowake"
echo "============================================================"

# ─── 前提条件チェック ──────────────────────────────────────────────────────
echo ""
echo "▶ 前提条件チェック..."

if ! command -v xcodebuild &>/dev/null; then
  echo "❌ Xcode がインストールされていません。App Store からインストールしてください。"
  exit 1
fi
echo "  ✓ Xcode: $(xcodebuild -version | head -1)"

if ! command -v node &>/dev/null; then
  echo "❌ Node.js がインストールされていません。https://nodejs.org からインストールしてください。"
  exit 1
fi
echo "  ✓ Node.js: $(node --version)"

if ! command -v pnpm &>/dev/null; then
  echo "  → pnpm をインストール中..."
  npm install -g pnpm@9
fi
echo "  ✓ pnpm: $(pnpm --version)"

if ! command -v pod &>/dev/null; then
  echo "  → CocoaPods をインストール中..."
  brew install cocoapods
fi
echo "  ✓ CocoaPods: $(pod --version)"

# ─── 依存パッケージインストール ────────────────────────────────────────────
echo ""
echo "▶ npm パッケージインストール..."
cd "${REPO_ROOT}"
pnpm install

# ─── API クライアントビルド ─────────────────────────────────────────────────
echo ""
echo "▶ API クライアントビルド..."
pnpm --filter @workspace/api-client-react run build 2>/dev/null || echo "  (ビルド不要またはスキップ)"

# ─── Capacitor Web ビルド ───────────────────────────────────────────────────
echo ""
echo "▶ Vite ビルド (Capacitor 向け dist-cap) ..."
cd "${RESCUEAT_DIR}"
pnpm run build:cap

# ─── iOS プラットフォーム追加 ───────────────────────────────────────────────
echo ""
echo "▶ Capacitor iOS プラットフォーム追加..."
if [ -d "${RESCUEAT_DIR}/ios/App/App.xcodeproj" ]; then
  echo "  → ios/ ディレクトリが既に存在します。スキップします。"
else
  npx cap add ios
fi

# ─── Capacitor 同期 ─────────────────────────────────────────────────────────
echo ""
echo "▶ cap sync ios (Web アセット → iOS プロジェクトへコピー)..."
npx cap sync ios

# ─── アイコン・スプラッシュ生成 ─────────────────────────────────────────────
echo ""
echo "▶ アイコン・スプラッシュ画像生成..."
if [ -f "${RESCUEAT_DIR}/resources/icon.png" ]; then
  pnpm run cap:gen-assets || echo "  ⚠ アセット生成をスキップ（resources/icon.png が見つかりません）"
else
  echo "  ⚠ resources/icon.png が見つかりません。アイコン生成をスキップします。"
  echo "    → 1024x1024 px の PNG を resources/icon.png として配置後、pnpm run cap:gen-assets を実行してください。"
fi

# ─── Bundle ID 確認 ─────────────────────────────────────────────────────────
echo ""
echo "▶ Bundle ID の確認..."
BUNDLE_ID=$(cd "${RESCUEAT_DIR}" && npx cap config get appId 2>/dev/null || grep -m1 "PRODUCT_BUNDLE_IDENTIFIER" ios/App/App.xcodeproj/project.pbxproj 2>/dev/null | awk '{print $3}' | tr -d '";')
echo "  Bundle ID: ${BUNDLE_ID:-com.yuhi.osusowake (確認できません)}"

# ─── 完了 ────────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo "  ✅ セットアップ完了!"
echo ""
echo "  次のステップ:"
echo "  1. Xcode でプロジェクトを開く:"
echo "     $ pnpm --filter @workspace/rescueat run cap:open"
echo ""
echo "  2. Xcode で以下を設定:"
echo "     - Signing & Capabilities → Team を選択"
echo "     - Bundle Identifier: com.yuhi.osusowake を確認"
echo ""
echo "  3. Xcode Cloud を設定:"
echo "     Xcode → Product → Xcode Cloud → Create Workflow"
echo "     → CI スクリプトは ios/App/ci_scripts/ に配置済み"
echo ""
echo "  4. 開発中の差分反映:"
echo "     $ pnpm --filter @workspace/rescueat run cap:sync"
echo "============================================================"
