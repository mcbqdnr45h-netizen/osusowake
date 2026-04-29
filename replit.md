# 食べロス

## Overview

日本版フードロス削減アプリ。飲食店が閉店前の余剰食品を「サプライズバッグ」として安価に販売し、ユーザーが予約・決済できるプラットフォーム（Too Good To Go の日本版）。

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Frontend**: React + Vite (artifacts/rescueat) - メインカラー #2D5A51
- **API framework**: Express 5 (artifacts/api-server)
- **Database**: Supabase PostgreSQL + Drizzle ORM（全テーブル Supabase に統一）
- **Map**: Google Maps JS API（`VITE_MAPS_API_KEY`）+ Google Places Autocomplete（店舗登録）
- **Payments**: Stripe（STRIPE_SECRET_KEY設定時）、未設定時はモック決済
- **Validation**: Zod, drizzle-zod
- **Font**: Noto Sans JP (body) + Outfit (display)
- **Color**: #F26419 テラコッタオレンジ / #F6AE2D ハニーアクセント / #FBFBFA オフホワイト背景
- **PWA**: manifest.json + sw.js (プッシュ通知対応、本番デプロイ後有効)
- **iOS ネイティブ**: Capacitor 8 でラッピング（Bundle ID: `com.yuhi.osusowake`）、Xcode Cloud CI 対応
- **CSS Utilities**: skeleton-shimmer, img-fade-in, hide-scrollbar, scroll-snap-x, tap-scale, hover-lift (index.css)
- **Accessibility**: prefers-reduced-motion 対応済み (img-fade-in, scroll-snap無効化)

## Features

1. **マップ表示** - Leafletマップ＋クラスタリング（緑の丸に店舗数）、現在地ボタン、一覧/地図切替
2. **サプライズバッグ一覧** - 割引%バッジ、残り在庫（3個未満は警告）、受取時間、価格
3. **バッグ詳細・予約** - 数量選択、今すぐ予約ボタン（画面下部固定CTA）
4. **決済** - Stripe決済（またはモック）
5. **予約一覧** - ピックアップコード付き、ステータス管理
6. **店舗管理ダッシュボード** - 爆速出品フォーム（価格入力で割引%リアルタイム計算）
7. **5タブ底部ナビゲーション** - 発見・検索・お届け・お気に入り・マイページ/ログイン（親指フレンドリー）
8. **徒歩時間表示** - GPSとHaversine計算式でリアルタイム徒歩分数（BagCard・BagDetail両方に表示）
9. **画像スケルトン** - 全カード画像を4:3固定アスペクト比＋スケルトンローダー（ガタつきなし）
10. **PWA** - インストール対応（ホーム画面追加）、ブラウザプッシュ通知基盤（sw.js）

## Pages

- `/` - ホーム（マップ＋バッグ一覧）、お知らせバナー表示
- `/bags/:id` - バッグ詳細
- `/checkout/:id` - 決済
- `/my-reservations` - 予約一覧
- `/store-dashboard` - 店舗管理
- `/search` - 検索
- `/favorites` - お気に入り
- `/mypage` - マイページ（ベルアイコン→お知らせ展開）
- `/admin` - 管理者ダッシュボード（神モード）※yuuhi0125416@icloud.comのみアクセス可

## Database Tables（全テーブル Supabase PostgreSQL）

> **DB 接続**: `lib/db/src/index.ts` が `SUPABASE_DATABASE_URL`（SSL付き）を使用。  
> `DATABASE_URL`（Replit ローカル DB）は使用しない。

- `stores` - 店舗情報（lat/lng含む）、`status`: `pending_review` → `approved` / `rejected` / `suspended`
- `surprise_bags` - バッグ出品情報
- `reservations` - 予約情報（ステータス・ピックアップコード含む）
- `notifications` - ユーザー通知（お知らせ含む）
- `announcements` - 管理者が全ユーザーに配信するお知らせ
- `web_push_subscriptions` - Webプッシュ通知購読情報
- `app_settings` - アプリ設定KVストア（キャッチコピー・メンテナンスモード等）
- `reports` / `reviews` - 報告・レビュー
- `users` - Supabase Auth と連携したプロフィール（public.users）

## Seed Data

**東京エリア**: 渋谷、新宿、表参道、上野、池袋、青山 × 6店舗
**大阪エリア（デモ用）**: 江坂、吹田、高槻、千里中央、摂津 × 8店舗

## 店舗登録フロー（重要）

### 登録 → bank-setup 遷移設計
- `/store-onboarding`（StoreOnboarding.tsx）: 基本情報 + 営業許可証アップロード
  - フォーム: 店名・住所・市区町村・ジャンル・写真・**営業許可証（必須）**・誓約チェック
  - `POST /api/stores/apply` を送信（`licenseImageBase64` / `copyLicenseFromStoreId` 対応）
  - **初回登録（isInherited=false）**: 成功後 `/store/bank-setup` へ遷移
  - **追加登録（isInherited=true: `?add=1` かつ Stripe アカウント済み）**: `/mypage` へ遷移（bank-setup スキップ）
  - `?add=1` クエリパラメータで追加登録モード → 既存店舗リダイレクトをスキップ
  - 追加登録時: 「本人確認・口座情報は引き継がれます」バナー表示
  - 追加登録時: 既存店舗の営業許可証コピー機能（`copyLicenseFromStoreId` で API 側でコピー）
- `/api/stores/apply` は `status: "pending_review"` で登録（管理者審査あり）
  - `copyLicenseFromStoreId` → 同一オーナーの店舗から営業許可証を複製
  - lat/lng が未指定の場合は東京デフォルト座標を使用
- `MyStore` 型: `licenseImageUrl`, `licenseNumber` フィールド追加

## Stripe KYC フロー（重要）

- **一括処理設計**: `/store/kyc-setup` ページは廃止。`/store/bank-setup` 1画面ですべて完結
- `POST /api/stores/:id/connect/bank-setup` が以下を一括処理:
  1. Stripe Custom Account作成/更新（TOS同意含む）
  2. 銀行口座トークンを外部アカウントとして紐付け
  3. 本人確認書類（表面/裏面）を `stripe.files.create` でアップロード
  4. `stripe.accounts.update` で全KYCデータ（氏名漢字/カナ・住所・DOB・電話）+ 書類IDを一括送信
  5. DBステータスを `approved` に更新（入力完了の証として強制セット）
- `approved` ステータス → `bank-setup` ページはフォームを再表示せず「登録済み」画面へ
- タイムアウト設計: Stripe calls=25〜30秒、bank-setup全体=90秒クライアントタイムアウト

## API Routes

- `GET /api/stores` - 全店舗一覧
- `GET /api/bags` - 全バッグ一覧（店舗情報込み）
- `GET /api/bags/:id` - バッグ詳細
- `GET/POST /api/stores/:id/bags` - 店舗バッグ管理
- `PUT /api/bags/:id` - バッグ更新
- `GET/POST /api/reservations` - 予約CRUD
- `PUT /api/reservations/:id` - 予約ステータス更新
- `POST /api/reservations/:id/cancel` - キャンセル
- `POST /api/payment/create-intent` - Stripe PaymentIntent作成
- `POST /api/payment/confirm` - 決済確認

## データベース設計（重要）

- **ローカル Replit PostgreSQL** (`DATABASE_URL`): stores, surprise_bags, reservations, reviews, reports
  - `@workspace/db`（`lib/db/`）は必ず `DATABASE_URL` のみを使用する（SUPABASE_DATABASE_URL を使わない）
- **Supabase** (`SUPABASE_DATABASE_URL`): users テーブル（Supabase Auth 連携）
  - `supabaseAdmin` クライアント経由でのみアクセス（API サーバー起動時の users.display_name マイグレーションを含む）

## 起動時マイグレーション（`artifacts/api-server/src/index.ts`）

- `surprise_bags.category` カラム追加（冪等）
- カテゴリ値リマッピング（旧カテゴリ → meals/bakery_sweets/ingredients）
- `stores.approval_email_sent` カラム追加（冪等）
- [supabase] `users.display_name` カラム追加（SUPABASE_DATABASE_URL が設定されている場合）

## Environment Variables

- `DATABASE_URL` - PostgreSQL接続文字列（自動プロビジョニング）・ローカルDB（stores等）
- `SUPABASE_DATABASE_URL` - Supabase DB URL（users.display_name マイグレーション専用）
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` - Supabase Auth
- `STRIPE_SECRET_KEY` - Stripeシークレットキー（任意・未設定でモック）
- `VITE_STRIPE_PUBLIC_KEY` - Stripeパブリックキー（任意）

## Recent Bug Fixes (2026-04-29)

8件のユーザー報告バグを一括修正：

1. **Stripe再同期 401**: `StoreDashboard.tsx#syncStripeStatus` を `authedFetch` 化 + 失敗詳細表示
2. **店舗プロフィール保存 401**: `StoreProfileEdit.tsx` 3 箇所 (GET/upload/PUT) を `authedFetch` 化
3. **店舗の商品 CRUD 401**: `StoreDashboard.tsx` の bag PATCH/DELETE 6 箇所を `authedFetch` 化
4. **お客様プロフィール not_found**: `Settings.tsx` で `VITE_API_BASE` 解決 + status code 含むエラー toast。 サーバ `/user/display-name` を「行有無で update / insert 分岐」 に変更し、 既存行の email を null で破壊しないよう保護
5. **食品ロス削減量 1kg の根拠不明**: `MyPage.tsx` に「※ おすそわけバッグ1個 ≒ 約500g 換算」 注釈
6. **営業時間ピッカー下部切れ**: `TimePicker.tsx` paddingBottom を `calc(6rem + safe-area-inset)`、 `z-[60]`、 `shadow-2xl`
7. **iOS 印刷ボタン無反応**: `Orders.tsx#handlePrint` で Capacitor.isNativePlatform / iOS UA 判定 → ネイティブでは `navigator.share` ＋ 失敗時はスクリーンショット案内 alert (AbortError キャンセル時は黙って終了)
8. **キャンセル済注文の領収書発行**: `Orders.tsx` `selected = picked_up` のみ
9. **商品詳細ページ下部に領収書 DOM が見える**: 原因は `window.print()` 後 iOS Safari で `afterprint` 不発 → `osusowake-print-root` が body 残存。 `matchMedia('print') change` リスナー + 30 秒 setTimeout の double-fail-safe で確実 cleanup。 `App.tsx` 起動時に既に stuck な print-root を削除する保険も追加

### 設計メモ
- `lib/authed-fetch.ts` は Supabase session から Bearer 自動付与。 認証必須 API 呼び出しは必ずこれを使う
- vite manualChunks は **絶対 NG** (framer-motion 内 react path 誤マッチで真っ白事故)
- Capacitor 8 server.url=https://osusowakejapan.org/ リモートロード方式 → web デプロイで iOS 自動反映
