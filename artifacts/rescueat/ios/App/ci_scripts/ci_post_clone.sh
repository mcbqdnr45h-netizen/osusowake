#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — ci_post_clone.sh
# リポジトリクローン直後に実行される環境セットアップスクリプト
# Swift Package Manager の依存解決の前に node_modules を用意する必要がある
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [ci_post_clone] Osusowake iOS ビルド環境セットアップ ==="
echo "Xcode Cloud Build Number : ${CI_BUILD_NUMBER:-unknown}"
echo "Branch                   : ${CI_BRANCH:-unknown}"

# ─── Homebrew PATH の設定 ───────────────────────────────────────────────────
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

if [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

echo "Homebrew: $(brew --version 2>/dev/null | head -1 || echo 'not found')"

# ─── Node.js インストール ────────────────────────────────────────────────────
if ! command -v node &>/dev/null; then
  echo "[ci_post_clone] Installing Node.js..."
  brew install node@20
  brew link --overwrite node@20
fi

NODE_VERSION=$(node --version 2>/dev/null || echo "N/A")
echo "Node.js: ${NODE_VERSION}"

# ─── pnpm インストール ────────────────────────────────────────────────────────
if ! command -v pnpm &>/dev/null; then
  echo "[ci_post_clone] Installing pnpm..."
  npm install -g pnpm@9
fi

PNPM_VERSION=$(pnpm --version 2>/dev/null || echo "N/A")
echo "pnpm   : ${PNPM_VERSION}"

# ─── CocoaPods インストール確認 ───────────────────────────────────────────────
if ! command -v pod &>/dev/null; then
  echo "[ci_post_clone] Installing CocoaPods..."
  brew install cocoapods
fi

POD_VERSION=$(pod --version 2>/dev/null || echo "N/A")
echo "CocoaPods: ${POD_VERSION}"

# ─── リポジトリルートに移動 ───────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
RESCUEAT_DIR="${REPO_ROOT}/artifacts/rescueat"

echo "Repo root    : ${REPO_ROOT}"
echo "Rescueat dir : ${RESCUEAT_DIR}"
cd "${REPO_ROOT}"

# ─── pnpm install (SPM 解決前に node_modules を用意) ─────────────────────────
echo "=== [ci_post_clone] pnpm install ==="
pnpm install --frozen-lockfile

# ─── API クライアントビルド ──────────────────────────────────────────────────
echo "=== [ci_post_clone] API クライアントビルド ==="
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true

# ─── Vite Web アセットビルド ─────────────────────────────────────────────────
echo "=== [ci_post_clone] Vite build (dist-cap) ==="
cd "${RESCUEAT_DIR}"
MAPS_API_KEY="${MAPS_API_KEY:-}" \
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.osusowake.app}" \
pnpm run build:cap

echo "dist-cap contents:"
ls -lh dist-cap/ | head -20

# ─── Capacitor 同期 (SPM パッケージのリンクを更新) ───────────────────────────
echo "=== [ci_post_clone] cap sync ios ==="
npx cap sync ios --no-build

echo "=== [ci_post_clone] 完了 ==="
