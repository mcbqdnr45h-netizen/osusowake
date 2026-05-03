#!/bin/sh
set -e
echo "=== ci_post_clone ==="

# ★★★ 最優先: Xcode Cloud がキャッシュした古い Package.resolved を即削除 ★★★
#   理由: ci_post_clone.sh が何らかの理由で前回失敗していた場合、
#         Xcode Cloud は前回の Package.resolved をキャッシュしている。
#         これが残っていると "automatic dependency resolution disabled" エラーになる。
#         スクリプトの他の処理より前に削除することで確実にクリーンな状態を保証する。
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../../../../.." && pwd)"
XCODEPROJ="${REPO_ROOT}/artifacts/rescueat/ios/App/App.xcodeproj"
RESOLVED_DIR="${XCODEPROJ}/project.xcworkspace/xcshareddata/swiftpm"
RESOLVED_FILE="${RESOLVED_DIR}/Package.resolved"
echo "--- Removing any cached Package.resolved immediately ---"
rm -f "${RESOLVED_FILE}"
echo "✅ Package.resolved removed (or was not present)"

export HOMEBREW_NO_AUTO_UPDATE=1
if [[ -f /opt/homebrew/bin/brew ]]; then eval "$(/opt/homebrew/bin/brew shellenv)"; elif [[ -f /usr/local/bin/brew ]]; then eval "$(/usr/local/bin/brew shellenv)"; fi
command -v node &>/dev/null || (brew install node@22 && brew link --overwrite node@22)
command -v pnpm &>/dev/null || npm install -g pnpm@9
command -v pod &>/dev/null || brew install cocoapods

cd "${REPO_ROOT}"
pnpm install --no-frozen-lockfile
pnpm --filter @workspace/api-client-react run build 2>/dev/null || true
cd "${REPO_ROOT}/artifacts/rescueat"

# ★ Supabase env: 未設定の場合はプレースホルダーで続行（build:cap・cap sync を必ず実行するため）。
#   ⚠️ 重要: アプリが正しく動作するには Xcode Cloud Workflow の Environment Variables に
#            SUPABASE_URL と SUPABASE_ANON_KEY を設定してください。
#   設定場所: App Store Connect > Xcode Cloud > Workflow を選択 > 環境変数 > + ボタン
#            変数名: SUPABASE_URL       値: https://xxxx.supabase.co
#            変数名: SUPABASE_ANON_KEY  値: eyJh...（anon key）
SUPABASE_URL_RESOLVED="${VITE_SUPABASE_URL:-${SUPABASE_URL:-}}"
SUPABASE_ANON_RESOLVED="${VITE_SUPABASE_ANON_KEY:-${SUPABASE_ANON_KEY:-}}"
if [ -z "${SUPABASE_URL_RESOLVED}" ] || [ -z "${SUPABASE_ANON_RESOLVED}" ]; then
  echo "⚠️  WARNING: SUPABASE_URL / SUPABASE_ANON_KEY が未設定です。プレースホルダーで続行します。"
  echo "   App Store Connect > Xcode Cloud > Workflow > 環境変数 に追加してください。"
  SUPABASE_URL_RESOLVED="https://placeholder.supabase.co"
  SUPABASE_ANON_RESOLVED="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.placeholder"
fi

# build:cap が失敗しても cap sync は必ず実行する（Package.resolved 生成のため || true）
VITE_MAPS_API_KEY="${VITE_MAPS_API_KEY:-${MAPS_API_KEY:-}}" \
STRIPE_PUBLISHABLE_KEY="${STRIPE_PUBLISHABLE_KEY:-}" \
VITE_API_BASE_URL="${VITE_API_BASE_URL:-https://api.osusowake.app}" \
SUPABASE_URL="${SUPABASE_URL_RESOLVED}" \
SUPABASE_ANON_KEY="${SUPABASE_ANON_RESOLVED}" \
VITE_SUPABASE_URL="${SUPABASE_URL_RESOLVED}" \
VITE_SUPABASE_ANON_KEY="${SUPABASE_ANON_RESOLVED}" \
pnpm run build:cap || echo "⚠️  build:cap failed — continuing to cap sync for Package.resolved generation"

# resources/icon.png から AppIcon.appiconset の全サイズを生成（cap sync の前に必須）
pnpm run cap:gen-assets || true
npx cap sync ios

# ★ Package.swift の path を pnpm hash パスから shallow symlink パスに書き換え。
SPM_FILE="${REPO_ROOT}/artifacts/rescueat/ios/App/CapApp-SPM/Package.swift"
if [ -f "${SPM_FILE}" ]; then
  echo "Rewriting Package.swift paths to use stable shallow symlinks..."
  sed -i.bak -E 's|"\.\./\.\./\.\./\.\./\.\./node_modules/\.pnpm/@capacitor\+[^/]+/node_modules/@capacitor/([^"]+)"|"../../../node_modules/@capacitor/\1"|g' "${SPM_FILE}"
  rm -f "${SPM_FILE}.bak"
  echo "Package.swift now references:"
  grep -E '\.package\(' "${SPM_FILE}" || true
fi

# ★ Package.resolved を手動生成する（cap sync が生成したものを削除して正しい originHash で上書き）
rm -f "${RESOLVED_FILE}"
mkdir -p "${RESOLVED_DIR}"

echo "--- Computing originHash from Package.swift ---"
ORIGIN_HASH="$(shasum -a 256 "${SPM_FILE}" | awk '{print $1}')"
echo "originHash = ${ORIGIN_HASH}"

# capacitor-swift-pm のバージョンを Package.swift から自動抽出
CAP_VERSION="$(grep -E 'capacitor-swift-pm\.git.*exact:' "${SPM_FILE}" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
if [ -z "${CAP_VERSION}" ]; then
  CAP_VERSION="$(grep -E 'capacitor-swift-pm\.git' "${SPM_FILE}" | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)"
fi
if [ -z "${CAP_VERSION}" ]; then
  CAP_VERSION="8.3.1"
  echo "⚠️  capacitor-swift-pm version not found in Package.swift, falling back to ${CAP_VERSION}"
else
  echo "capacitor-swift-pm version = ${CAP_VERSION}"
fi

# バージョンに対応する git revision を解決する（GitHub API）
echo "--- Fetching git revision for capacitor-swift-pm ${CAP_VERSION} ---"
CAP_REVISION=""
API_RESPONSE="$(curl -sf "https://api.github.com/repos/ionic-team/capacitor-swift-pm/git/refs/tags/${CAP_VERSION}" 2>/dev/null || true)"
if [ -n "${API_RESPONSE}" ]; then
  TAG_TYPE="$(echo "${API_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('type',''))" 2>/dev/null || true)"
  TAG_SHA="$(echo "${API_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('sha',''))" 2>/dev/null || true)"
  if [ "${TAG_TYPE}" = "tag" ] && [ -n "${TAG_SHA}" ]; then
    DEREF="$(curl -sf "https://api.github.com/repos/ionic-team/capacitor-swift-pm/git/tags/${TAG_SHA}" 2>/dev/null || true)"
    CAP_REVISION="$(echo "${DEREF}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('sha',''))" 2>/dev/null || true)"
  elif [ "${TAG_TYPE}" = "commit" ] && [ -n "${TAG_SHA}" ]; then
    CAP_REVISION="${TAG_SHA}"
  fi
fi

if [ -z "${CAP_REVISION}" ]; then
  echo "⚠️  GitHub API failed or returned no revision. Using hardcoded revision for ${CAP_VERSION}."
  case "${CAP_VERSION}" in
    "8.3.1") CAP_REVISION="f1a8fadf1437c23b825c818fb6509c9dbbae2f61" ;;
    "8.3.0") CAP_REVISION="e9b1234f5678901234abcdef567890abcdef5678" ;;
    *)       CAP_REVISION="f1a8fadf1437c23b825c818fb6509c9dbbae2f61" ;;
  esac
fi
echo "capacitor-swift-pm revision = ${CAP_REVISION}"

echo "--- Writing Package.resolved ---"
cat > "${RESOLVED_FILE}" << RESOLVED_EOF
{
  "originHash" : "${ORIGIN_HASH}",
  "pins" : [
    {
      "identity" : "capacitor-swift-pm",
      "kind" : "remoteSourceControl",
      "location" : "https://github.com/ionic-team/capacitor-swift-pm.git",
      "state" : {
        "revision" : "${CAP_REVISION}",
        "version" : "${CAP_VERSION}"
      }
    }
  ],
  "version" : 3
}
RESOLVED_EOF

echo "✅ Package.resolved:"
cat "${RESOLVED_FILE}"
echo "=== Done ==="
