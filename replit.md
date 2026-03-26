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
- **Color**: #FF8C00 サンセットオレンジ
- **PWA**: manifest.json + sw.js (プッシュ通知対応、本番デプロイ後有効)

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
- `reports` / `reviews` - 報告・レビュー
- `users` - Supabase Auth と連携したプロフィール（public.users）

## Seed Data

**東京エリア**: 渋谷、新宿、表参道、上野、池袋、青山 × 6店舗
**大阪エリア（デモ用）**: 江坂、吹田、高槻、千里中央、摂津 × 8店舗

## 店舗登録フロー（重要）

### 登録 → bank-setup 即遷移設計
- `/store-onboarding`（StoreOnboarding.tsx）: 基本情報のみ入力（コンプライアンスステップ廃止）
  - フォーム: 店名・住所・市区町村・ジャンル・電話・写真・誓約チェック
  - `POST /api/stores/apply` を**2秒タイムアウト**で呼び出し（タイムアウトでも続行）
  - Stripe は一切呼ばない・書類アップロードなし
  - 成功・失敗・タイムアウトいずれの場合も即 `/store/bank-setup` へ `navigate()`
- `/api/stores/apply` は `status: "approved"` で即座に保存（管理者審査なし）
  - 重複登録 → 409 + `{ error: "already_exists", store: {...} }` を返す
  - lat/lng が未指定の場合は東京デフォルト座標を使用

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
