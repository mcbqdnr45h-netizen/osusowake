#!/bin/sh
set -e
echo "=== ci_post_clone ==="
export HOMEBREW_NO_AUTO_UPDATE=1
if [[ -f /opt/homebrew/bin/brew ]]; then eval "$(/opt/homebrew/bin/brew shellenv)"; elif [[ -f /usr/local/bin/brew ]]; then eval "$(/usr/local/bin/brew shellenv)"; fi
command -v node &>/dev/null || (brew install node@22 && brew link --overwrite node@22)
command -v pnpm &>/dev/null || npm install -g pnpm@9
command -v pod &>/dev/null || brew install cocoapods
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
cd "${REPO_ROOT}"
pnpm install --no-frozen-lockfile
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true
cd "${REPO_ROOT}/artifacts/rescueat"

# ★ Supabase 必須 env チェック (vite.config.cap.ts は未設定で throw する)。
#   Xcode Cloud Settings -> Environment Variables に SUPABASE_URL / SUPABASE_ANON_KEY を必ず登録。
SUPABASE_URL_RESOLVED="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_ANON_RESOLVED="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"
if [ -z "${SUPABASE_URL_RESOLVED}" ] || [ -z "${SUPABASE_ANON_RESOLVED}" ]; then
  echo "❌ FATAL: SUPABASE_URL / SUPABASE_ANON_KEY が Xcode Cloud secrets に未設定です。" >&2
  echo "   Xcode Cloud > Workflow > Environment Variables から両方追加してください。" >&2
  exit 1
fi

VITE_MAPS_API_KEY="${VITE_MAPS_API_KEY:-${MAPS_API_KEY:-}}" \
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.osusowake.app}" \
SUPABASE_URL="${SUPABASE_URL_RESOLVED}" \
SUPABASE_ANON_KEY="${SUPABASE_ANON_RESOLVED}" \
VITE_SUPABASE_URL="${SUPABASE_URL_RESOLVED}" \
VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_RESOLVED}" \
pnpm run build:cap
# resources/icon.png から AppIcon.appiconset の全サイズを生成（cap sync の前に必須）
pnpm run cap:gen-assets
npx cap sync ios

# ★ Package.swift の path を pnpm hash パスから shallow symlink パスに書き換え。
#   理由: cap sync が生成する path は `node_modules/.pnpm/@capacitor+<name>@<ver>_@capacitor+core@<ver>/...`
#   のように peer dep バージョンを hash に含むため、 環境間 (Replit/Mac/XcodeCloud) で
#   pnpm-lock.yaml の解決が 1 patch でも違うと SPM resolve が失敗する。
#   pnpm が必ず作る shallow symlink `node_modules/@capacitor/<name>` を直接参照することで
#   バージョン解決の差異を完全吸収する。
SPM_FILE="${REPO_ROOT}/artifacts/rescueat/ios/App/CapApp-SPM/Package.swift"
if [ -f "${SPM_FILE}" ]; then
  echo "Rewriting Package.swift paths to use stable shallow symlinks..."
  sed -i.bak -E 's|"\.\./\.\./\.\./\.\./\.\./node_modules/\.pnpm/@capacitor\+[^/]+/node_modules/@capacitor/([^"]+)"|"../../../node_modules/@capacitor/\1"|g' "${SPM_FILE}"
  rm -f "${SPM_FILE}.bak"
  echo "Package.swift now references:"
  grep -E '\.package\(name:' "${SPM_FILE}" || true
fi
echo "=== Done ==="
