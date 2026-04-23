#!/bin/sh
# ─────────────────────────────────────────────────────────────────────────────
# Xcode Cloud — ci_post_clone.sh
# リポジトリクローン直後に実行される環境セットアップスクリプト
# ─────────────────────────────────────────────────────────────────────────────
set -e

echo "=== [ci_post_clone] Osusowake iOS ビルド環境セットアップ ==="
echo "Xcode Cloud Build Number : ${CI_BUILD_NUMBER:-unknown}"
echo "Branch                   : ${CI_BRANCH:-unknown}"

# ─── Homebrew PATH の設定 ───────────────────────────────────────────────────
export HOMEBREW_NO_AUTO_UPDATE=1
export HOMEBREW_NO_INSTALL_CLEANUP=1

# Apple Silicon / Intel 両対応
if [[ -f /opt/homebrew/bin/brew ]]; then
  eval "$(/opt/homebrew/bin/brew shellenv)"
elif [[ -f /usr/local/bin/brew ]]; then
  eval "$(/usr/local/bin/brew shellenv)"
fi

echo "Homebrew: $(brew --version 2>/dev/null | head -1 || echo 'not found')"

# ─── Node.js インストール ────────────────────────────────────────────────────
# Xcode Cloud には Node.js がプリインストールされていないため Homebrew で導入
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

echo "=== [ci_post_clone] 完了 ==="
