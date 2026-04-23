#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — ci_pre_xcodebuild.sh
# Xcode ビルドの前に実行: Web アセットビルド → Capacitor 同期
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [ci_pre_xcodebuild] Web アセットビルド & Capacitor 同期 開始 ==="

# ─── PATH セットアップ ────────────────────────────────────────────────────────
export HOMEBREW_NO_AUTO_UPDATE=1

if [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

# Node.js の PATH を確実に通す
export PATH="/opt/homebrew/bin:/usr/local/bin:${PATH}"

# pnpm が入っていない場合は npm でインストール
if ! command -v pnpm &>/dev/null; then
  npm install -g pnpm@9
fi

echo "Node : $(node --version)"
echo "pnpm : $(pnpm --version)"

# ─── リポジトリルートへ移動 ───────────────────────────────────────────────────
# Xcode Cloud のワーキングディレクトリは ios/App/ci_scripts/ なので
# リポジトリルート（workspace ルート）に移動する
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# ci_scripts → App → ios → rescueat → artifacts → workspace_root (5段階)
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
RESCUEAT_DIR="${REPO_ROOT}/artifacts/rescueat"

echo "Repo root    : ${REPO_ROOT}"
echo "Rescueat dir : ${RESCUEAT_DIR}"
cd "${REPO_ROOT}"

# ─── 環境変数の検証 ──────────────────────────────────────────────────────────
echo "=== 環境変数チェック ==="

# Xcode Cloud のシークレット（Environment Variables に設定すること）
# 設定方法: Xcode → Product → Xcode Cloud → Manage Workflows → Environment
required_vars=(
  "MAPS_API_KEY"
  "STRIPE_PUBLISHABLE_KEY"
  "VITE_API_BASE_URL"
)

missing=0
for var in "${required_vars[@]}"; do
  if [[ -z "${!var}" ]]; then
    echo "WARNING: 環境変数 ${var} が未設定です"
    missing=$((missing + 1))
  else
    echo "  ✓ ${var} は設定済み"
  fi
done

if [[ $missing -gt 0 ]]; then
  echo "WARNING: ${missing} 個の環境変数が未設定のままビルドを続行します"
fi

# ─── pnpm 依存パッケージインストール ─────────────────────────────────────────
echo "=== [ci_pre_xcodebuild] pnpm install ==="
pnpm install --frozen-lockfile

# ─── API クライアントビルド (workspace lib) ───────────────────────────────────
echo "=== [ci_pre_xcodebuild] API クライアントビルド ==="
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true

# ─── Vite Web アセットビルド (Capacitor 向け) ────────────────────────────────
echo "=== [ci_pre_xcodebuild] Vite build (dist-cap) ==="
cd "${RESCUEAT_DIR}"

# Capacitor 向け Vite ビルド — 環境変数をインライン展開
Maps_API_KEY="${MAPS_API_KEY:-}" \
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.osusowake.app}" \
pnpm run build:cap

echo "dist-cap contents:"
ls -lh dist-cap/ | head -20

# ─── Capacitor 同期 ───────────────────────────────────────────────────────────
echo "=== [ci_pre_xcodebuild] cap sync ios ==="
npx cap sync ios --no-build

echo "=== [ci_pre_xcodebuild] 完了 ==="
