#!/bin/sh
set -e
echo "=== ci_post_clone ==="
export HOMEBREW_NO_AUTO_UPDATE=1
if [[ -f /opt/homebrew/bin/brew ]]; then eval "$(/opt/homebrew/bin/brew shellenv)"; elif [[ -f /usr/local/bin/brew ]]; then eval "$(/usr/local/bin/brew shellenv)"; fi
command -v node &>/dev/null || (brew install node@20 && brew link --overwrite node@20)
command -v pnpm &>/dev/null || npm install -g pnpm@9
command -v pod &>/dev/null || brew install cocoapods
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
cd "${REPO_ROOT}"
pnpm install --no-frozen-lockfile
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true
cd "${REPO_ROOT}/artifacts/rescueat"
MAPS_API_KEY="${MAPS_API_KEY:-}" STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.osusowake.app}" pnpm run build:cap
npx cap sync ios --no-build
echo "=== Done ==="
