# Osusowake — Xcode Cloud ビルド設定ガイド

Bundle ID: `com.yuhi.osusowake`

---

## 1. 前提条件（Mac での初回セットアップ）

```bash
# macOS + Xcode 15+ インストール済みであること
# Apple Developer Program 加入済みであること

# リポジトリをクローン後、ワークスペースルートで実行
bash artifacts/rescueat/scripts/ios-setup.sh
```

このスクリプトが以下を自動実行します:
1. 依存パッケージのインストール
2. Vite ビルド（`dist-cap/`）
3. `npx cap add ios` — Xcode プロジェクト生成
4. `npx cap sync ios` — Web アセット同期
5. アイコン・スプラッシュ画像生成

---

## 2. Info.plist の設定

`npx cap add ios` 実行後、生成された `ios/App/App/Info.plist` に以下の権限を追加してください。
（`ios/App/App/Info.plist.patch.xml` の内容を参照）

| キー | 用途 |
|------|------|
| `NSLocationWhenInUseUsageDescription` | 近くの店舗検索 |
| `NSCameraUsageDescription` | 店舗写真・本人確認書類撮影 |
| `NSPhotoLibraryUsageDescription` | 画像選択 |
| `NSPhotoLibraryAddUsageDescription` | QRコード保存 |
| `CFBundleURLTypes` | ディープリンク (`com.yuhi.osusowake://`) |

Xcode で設定する場合: Target → Info タブ → Custom iOS Target Properties

---

## 3. Xcode でのプロジェクト設定

```bash
pnpm --filter @workspace/rescueat run cap:open
```

Xcode 起動後:
1. **Signing & Capabilities**
   - Team: Apple Developer チームを選択
   - Bundle Identifier: `com.yuhi.osusowake` を確認
   - Automatically manage signing: ON

2. **General**
   - Deployment Target: iOS 16.0 以上
   - Version: 1.0.0
   - Build: 自動（Xcode Cloud が設定）

3. **Info**
   - Info.plist.patch.xml の内容を追加

---

## 4. Xcode Cloud ワークフロー設定

### 4-1. Xcode Cloud に接続

Xcode → Product → Xcode Cloud → **Create Workflow**

### 4-2. ワークフロー設定

| 設定項目 | 値 |
|----------|-----|
| Name | `Production Build` |
| Branch | `main` |
| Scheme | `App` |
| Configuration | `Release` |
| Archive | TestFlight / App Store Connect |

### 4-3. Start Conditions（トリガー）

- **Branch Changes**: `main` ブランチへの push
- **Tag Changes**: `v*` タグ（本番リリース用）

### 4-4. Environment Variables（シークレット）

Xcode Cloud ワークフロー → **Environment** タブで設定:

| 変数名 | 説明 | Secret |
|--------|------|--------|
| `MAPS_API_KEY` | Google Maps API キー | ✅ |
| `STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー | ✅ |
| `VITE_API_BASE_URL` | API サーバー URL | - |

設定例:
```
VITE_API_BASE_URL = https://api.osusowake.app
```

### 4-5. CI スクリプト（自動実行）

`ios/App/ci_scripts/` に配置済みのスクリプトが自動実行されます:

| スクリプト | タイミング | 内容 |
|------------|-----------|------|
| `ci_post_clone.sh` | クローン直後 | Node.js / pnpm / CocoaPods インストール |
| `ci_pre_xcodebuild.sh` | ビルド前 | `pnpm install` → `build:cap` → `cap sync` |
| `ci_post_xcodebuild.sh` | ビルド後 | 結果通知 |

---

## 5. 開発フロー（日常的な変更反映）

```bash
# Web アプリを変更後、iOS へ反映
pnpm --filter @workspace/rescueat run ios:update

# または
pnpm --filter @workspace/rescueat run cap:sync
```

---

## 6. ファイル構成

```
artifacts/rescueat/
├── capacitor.config.ts          # Capacitor 設定（Bundle ID等）
├── vite.config.cap.ts           # Capacitor 向け Vite ビルド設定
├── resources/
│   ├── icon.png                 # アプリアイコン（1024x1024 PNG）
│   └── splash.png               # スプラッシュ画像（2732x2732 PNG）
├── scripts/
│   └── ios-setup.sh             # Mac 初回セットアップスクリプト
└── ios/
    └── App/
        ├── ci_scripts/          # Xcode Cloud CI スクリプト（git 管理）
        │   ├── ci_post_clone.sh
        │   ├── ci_pre_xcodebuild.sh
        │   └── ci_post_xcodebuild.sh
        ├── Configurations/      # ビルド設定
        │   ├── Release.xcconfig
        │   └── Debug.xcconfig
        └── App/
            └── Info.plist.patch.xml  # Info.plist 追加エントリ一覧
```

---

## 7. トラブルシューティング

### `pod install` でエラー
```bash
cd ios/App && pod install --repo-update
```

### Web アセットが古い
```bash
pnpm --filter @workspace/rescueat run cap:sync
```

### Xcode Cloud でビルドエラー
- Xcode Cloud ダッシュボード → Build → ログを確認
- `ci_pre_xcodebuild.sh` のログで pnpm / Node.js の問題を特定

### Bundle ID が変わっている
- `capacitor.config.ts` の `appId` を確認
- Xcode → Signing & Capabilities で `com.yuhi.osusowake` に修正
