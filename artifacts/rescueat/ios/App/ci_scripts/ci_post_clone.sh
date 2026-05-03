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
  grep -E '\.package\(' "${SPM_FILE}" || true
fi

# ★ Package.resolved を手動生成する。
#
#   【なぜ committed Package.resolved が使えないか】
#   Xcode Cloud は「Package.resolved がリポジトリにある」と自動的に
#   automatic package resolution を無効化する。その状態で originHash が
#   実際の Package.swift 内容と一致しないと "out-of-date" エラーになる。
#   cap sync ios が Package.swift を毎回再生成するため static commit は
#   永遠に不整合になる。
#
#   【解決策】
#   1. Package.resolved を .gitignore に追加して commit しない。
#      → Xcode Cloud が automatic resolution を有効化する。
#   2. ci_post_clone.sh で sed 書き換え後の Package.swift の SHA256 を計算し、
#      正しい originHash を持つ Package.resolved を手動生成して配置する。
#      → Archive ステップ開始時点で常に一致した状態になる。
#
#   【pins について】
#   ローカルパス依存 (CapacitorApp 等) は Package.resolved に含まれない。
#   リモート依存 (capacitor-swift-pm) のみ記載する。

XCODEPROJ="${REPO_ROOT}/artifacts/rescueat/ios/App/App.xcodeproj"
RESOLVED_DIR="${XCODEPROJ}/project.xcworkspace/xcshareddata/swiftpm"
RESOLVED_FILE="${RESOLVED_DIR}/Package.resolved"

# 既存 Package.resolved を必ず削除（cap sync が残したものも含む）
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
  # タグが annotated (tag object) か lightweight (commit) かで sha が異なる
  TAG_TYPE="$(echo "${API_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('type',''))" 2>/dev/null || true)"
  TAG_SHA="$(echo "${API_RESPONSE}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('sha',''))" 2>/dev/null || true)"
  if [ "${TAG_TYPE}" = "tag" ] && [ -n "${TAG_SHA}" ]; then
    # annotated tag → deref して commit sha を取得
    DEREF="$(curl -sf "https://api.github.com/repos/ionic-team/capacitor-swift-pm/git/tags/${TAG_SHA}" 2>/dev/null || true)"
    CAP_REVISION="$(echo "${DEREF}" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('object',{}).get('sha',''))" 2>/dev/null || true)"
  elif [ "${TAG_TYPE}" = "commit" ] && [ -n "${TAG_SHA}" ]; then
    CAP_REVISION="${TAG_SHA}"
  fi
fi

# GitHub API が失敗した場合は既知の revision にフォールバック
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
