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

## 価格表示モデル (重要)

**税込・サービス料込み総額表示モデル** (Too Good To Go / Olio 方式に移行 — 2026年5月)。
- 店舗が登録する `discountedPrice` = **店舗が受け取りたい商品代金** (店舗の取り分計算ベース)
- ユーザー画面の表示価格 = `getDisplayPrice(discountedPrice) = round(price * 1.05 / 10) * 10` (`lib/price-display.ts`)
- ユーザーには手数料表記は **一切表示しない** (BagDetail / BagCard / SearchPage / StoreDetailPublic / Checkout すべて総額のみ)
- 店舗側 (StoreBagsPage / RegisterStore / StoreSalesPage / StoreOwnerDashboard / BagManageCard) は raw discountedPrice ベース表示 + 入力時に「お客様への表示価格」プレビュー
- バックエンド (`payment.ts` / `reservations.ts`) の Stripe Connect destination charge / 25% 店舗手数料計算は変更なし、`USER_SERVICE_FEE_RATE = 0.05` も継続
- 法律文言 (Terms 第5条の2 / TokushoPage / HelpPage) は「総額表示・追加料金なし」モデルに更新済み
- ⚠️ BagDetail CTA 等の qty>1 計算は必ず `getDisplayPrice(price * qty)` (multiply先→round) でサーバー `round10(merchandise * 1.05)` と整合させる
- ❌ 削除済: `FeeInfoSheet.tsx`, `stock-urgency.ts::calculateFeeBreakdown`, BagDetail の「+ 手数料 5% ⓘ」ピル, Checkout の「商品代金 + システム利用料 5%」内訳

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
11. **App Store 審査用 決済バイパス** - `APP_REVIEW_BYPASS_EMAILS` (default: `review-user@osusowakejapan.org`) の allowlist にメールが一致するユーザーのみ、 `/api/payment/create-intent` が `clientSecret="REVIEW_BYPASS"` + `reviewBypass:true` を返し、 フロントは Stripe Elements を出さず専用 UI から `/api/payment/confirm` に直接遷移。 confirm は `paymentIntentId.startsWith("pi_review_bypass_")` AND email allowlist の二重チェックで Stripe verify を skip し、 さらに **対象バッグのストアオーナーが `APP_REVIEW_DEMO_OWNER_IDS` (default: `3f3a4139-207c-45a9-bcdc-5dc79bfe7c3f`) の allowlist に一致する場合のみ** 在庫減算もスキップ (Supabase store #123 / bag #104 の在庫が枯渇しない)。 通常ユーザーや、審査ユーザーが実店舗バッグを買った場合には一切影響しない (payment.ts の `isAppReviewBypassEmail()` ∧ `isReviewDemoOwner()`)。 詳細: `artifacts/rescueat/APP_STORE_SUBMISSION.md` §5
12. **審査用デモバッグ恒久表示** - `lib/app-review.ts` の `isReviewDemoOwner()` で UUID allowlist 判定。 `bags.ts` の `isBagExpired()` (JS) と `notExpiredCondition` (SQL CASE 0) でデモオーナーのバッグを expiry チェック対象外にし、 `reservations.ts` も同様に bypass。 結果、デモストア (Supabase store #123, owner `3f3a4139-...`) のバッグ #104 (¥1500→¥500, 在庫10, pickup 18:00-20:00) は日付・時刻に関係なく常に一覧表示・予約可能。
13. **シェア機能** - `components/ShareAppCard.tsx` で `navigator.share()` (Web Share API / iOS Capacitor 対応) → 失敗時は LINE/X/Facebook/コピーリンクのフォールバック展開。 マイページ (一般ユーザー版・店舗オーナー版) の「アカウント・サポート」直前に「おすそわけを広める」セクションとして配置。 共有 URL は `https://osusowakejapan.org`、文言は variant=user/store で出し分け。
14. **使い方ガイド** - `pages/UsageGuide.tsx` (`/usage-guide`, `/guide`) FAQ (`/help`) とは別に、 6ステップの図解＋使いこなしのコツ＋シェアカード＋FAQ導線で構成。 `?mode=store` または `profile.role==='store_owner'` で店舗編、それ以外はユーザー編を表示。 マイページの「アカウント・サポート」内ヘルプの上に配置 (BookOpenアイコン)。
15. **パスワード変更** - `components/ChangePasswordModal.tsx` (現在PW再認証→新PW更新→トースト表示)。 設定 (`Settings.tsx`) のアカウントセクション、ログアウトの上に配置。 メール/パスワードプロバイダのユーザーのみ表示 (`user.identities.provider==='email'` 判定、Google等のソーシャル専用ユーザーには非表示)。 モーダル内に「現在のパスワードを忘れた方はこちら」リンクで `supabase.auth.resetPasswordForEmail` 経由のリセットメール送信もエスケープハッチとして提供。
16. **ランキング完全オプトイン化** (2026年5月・B案: 全員リセット) - ニックネームは登録時不要、 ランキング参加時のみ要求する完全オプトインモデルへ移行。
    - **DB**: `users.ranking_opt_out` を `DEFAULT true` に変更し、 `app_settings` に `ranking_opt_in_reset_2026_05` フラグを置き既存ユーザー全員を一回限り `ranking_opt_out=true` にリセット (api-server `index.ts` migration)。 新規ユーザーもデフォルト非掲載。
    - **API**: `POST /auth/create-profile` の customer 用 `display_name` 必須を撤廃 (任意化)、 `PATCH /user/ranking-preference` で `rankingOptOut=false` 設定時のみ `display_name` 必須を検証 (`display_name_required` 400)。
    - **Frontend**: `SignUp.tsx` のニックネーム欄を完全削除 (氏名/電話/メール/PW のみで登録完了)。 `Layout.tsx` の `needsNicknameSetup` 強制モーダル撤廃、 `NicknameRequiredModal.tsx` 削除。 新コンポーネント `RankingJoinModal.tsx` でニックネーム入力 → display_name PUT → ranking-preference PATCH を順次実行。 `Settings.tsx` の表示名欄は「ニックネーム (任意)」+ 用途説明に変更。
    - **誘導**: `MyPage.tsx` のランキングカードは非参加者に「参加しよう！」 CTA、 `RankingPage.tsx` は非参加者向け Hero CTA + sticky bottom 「参加する」 ボタン → モーダルで即時参加可能。 既存参加者は従来どおり表示名プレビュー + 掲載 ON/OFF トグル。

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

## Recent Updates (2026-05-01)

### 神モード AdminDashboard 全面リニューアル + 営業許可証 silent fail 修正（ASC 提出前）
1. **DB schema 拡張** (`lib/db/src/schema/stores.ts` + `artifacts/api-server/src/index.ts` 起動時マイグレーション): `stores.license_upload_failed BOOL DEFAULT FALSE` / `license_upload_error TEXT` / `license_upload_attempted_at TIMESTAMPTZ` を追加。
2. **bank-setup silent fail 修正** (`artifacts/api-server/src/routes/stores.ts` L2748-2805): `/api/stores/bank-setup` の bg upload (Supabase storage への営業許可証画像アップロード) が失敗しても `licenseNumber` だけ DB に保存されて画像欠落のまま public 公開される設計バグ。Supabase upload 結果を `license_upload_failed` / `license_upload_error` / `license_upload_attempted_at` に記録、admin 検出可能化。
3. **/admin/metrics 大幅拡張** (`artifacts/api-server/src/routes/admin.ts`): `?excludeTest=1` (`stripe_account_id IS NULL` を除外) サポート、`dailySeries` (直近30日)、`storeRanking` (TOP5 GMV/受取率)、`hourlyHeatmap` (7×24 予約作成時刻分布)、`breakdown` (受取済/予約確定/キャンセル/平均単価)、`anomalies` (24h以上 pending、cancellation 率高 (rate は 0..1 ratio で返却)、licenseIssueCount)、`storeBreakdown` (実店舗/テスト店舗) を追加。
4. **/admin/license-issues** 新設: `license_image_url IS NULL OR license_upload_failed = TRUE` の店舗一覧。`severity` (high/medium/low)、`issue_type` (upload_failed / image_missing_but_number_set / no_license_at_all) 付き。
5. **/admin/stores/:storeId/request-license-reupload** 新設: 店主への再アップロード要求記録 (フラグ + 監査ログ)。
6. **AdminDashboard.tsx 全面改修**: 🚨 営業許可証問題バナー (severity 別バッジ・再アップ要求ボタン)、テスト店フィルタトグル (state `excludeTest` を `fetchAll` deps に渡して切替時 re-fetch)、売上ブレイクダウン (4 カード)、recharts LineChart (直近30日 売上推移)、店舗ランキング TOP5 (棒グラフ・受取率カラー警告)、時間帯ヒートマップ (7×24 div グリッド・紫グラデ)、ファネル (作成→確定→受取・キャンセル率)、異常検知カード。recharts ^2.15.2 + 既存 lucide icons + framer-motion で構成。
7. **SW v26→v27**: `artifacts/rescueat/public/sw.js` キャッシュ更新。
8. **🚨 push 通知 致命的バグ修正**: `pickup-reminder.ts` / `payment.ts` (2箇所) / `bags.ts` の 4トリガーが `sendWebPushToUser` (web 専用) しか呼んでおらず、APNs (iOS native) は初期化済みなのに 0件 invoke という状態。`sendPushToUser` (`Promise.allSettled([web, apns])`) に統一して両方並列送信。APNs production 切替は `process.env.NODE_ENV === 'production'` で自動 (Replit Deploy 後は production endpoint へ)。

## Recent Updates (2026-04-30)

### 残課題4件の修正完了（収益モデル統一の延長）
1. **bags.ts allergyInfo/pickupNote TS error**: `lib/api-spec/openapi.yaml` の `CreateBagRequest`/`UpdateBagRequest` に `allergyInfo` / `pickupNote` を追加（`UpdateBagRequest` には不足していた `imageUrl`/`category` も追加）。`pnpm --filter @workspace/api-spec run codegen` で zod / orval / d.ts 再生成。
2. **payment.ts L211 body.userId**: `/payment/create-intent` で client-supplied `body.userId` を使っていたため TS error + セキュリティリスク → `req.authUser!.id` に統一（`/checkout/session` と同パターン）。
3. **/checkout/verify セキュリティ強化**: `session.metadata.reservationId !== String(reservation_id)` の場合は `403 reservation_mismatch` を返す。これがないと攻撃者が他人の `session_id` と自分の `reservation_id` を組み合わせて偽の paid 状態を作れた。`session.metadata.reservationId` は checkout-session 作成時に `String(reservation.id)` で保存しているため、URL クエリと文字列比較で一致確認。
4. **Webhook Separate C&T transfer**: 旧実装は `/checkout/verify` でしか手動 Transfer を実行していなかったため、ユーザがチェックアウト完了後にブラウザを閉じると店舗送金が走らなかった。`stripe-webhook.ts` の `payment_intent.succeeded` ハンドラに共通ヘルパー `executeShopTransferIfNeeded` を追加し、`paid` (初回) と `already_paid` (verify が先に paid 化したが Transfer 失敗していたケースのリカバリ) の両方で実行。/checkout/verify と完全に同一のパラメータ + 同じ `idempotencyKey: transfer:reservation:${id}` を使うため、Stripe 側で 1 回だけ Transfer が作成される（二重送金なし、prior response replay 安全）。

## Recent Updates (2026-05-02)

### 同一オーナの自己重複登録ブロック (前リリースのリグレッション修正)
ユーザ報告: スクショで「松村製麺所」 が同じ住所で 2件 (pending + approved) 登録されていた。 直前の「別オーナ重複ブロック撤廃」 リリースで WHERE 句に `ne(ownerId, ownerId)` を残したまま判定対象から同オーナ行を除外していたため、 同オーナの自己二重登録が無検査で通っていた。
- `stores.ts /stores/apply` L235-290: WHERE を `status IN ('pending','approved')` のみに絞り、 候補に対して (a) `ownerId` 一致 → **409 `self_duplicate`** で即ブロック (`existingStoreId` / `existingStatus` を返す)、 (b) `ownerId` 不一致 → 警告ログのみ (フードコート等の正規ケースは引き続き許可) という二段判定に。
- `StoreOnboarding.tsx` L413-428: 409 self_duplicate 専用ハンドラ追加 → トースト通知 + `clearOnboardingDraft()` + `refetchStores()` + `/mypage` 遷移。
- 既存 `isSubmitting` ガード + ボタン disabled で実用的な二重タップ防止は維持。 厳密な並行リクエスト保護は将来の DB UNIQUE INDEX (ownerId, normalize(name+addr+city)) で対応予定 (スコープ外)。
- architect 評価: 条件付き Pass (重大違反なし、 残懸念は並行レースのみで設計通り)。

### 2店舗目登録 致命的3バグ修正 (営業許可証 UI 欠落 + 重複ブロック誤検出 + Stripe 再有効化未実装)
HelpPage で「2店舗目以降は営業許可証の提出のみで完了」 と謳う仕様にも関わらず、 StoreOnboarding に営業許可証 UI が存在せず、 サーバ `/stores/apply` は body.licenseImageBase64 を期待していたため 2店舗目は全て営業許可証 NULL のまま approved 化されていた。 さらに別オーナの同店名・同住所を 409 でブロックするロジックがフードコート / 同一ビル別テナント等の正規申請を誤検出し、 既存 Stripe アカウントが `charges_enabled=false` (口座無効化・KYC期限切れ) の状態で 2店舗目を登録してもサイレントに承認される問題があった。 本リリースで以下を修正:
1. **営業許可証 UI 追加** (`StoreOnboarding.tsx`): isInherited (=isAddMode && hasExistingStripeAccount) 時のみ営業許可証セクション (画像 + 番号) 表示。 `handleBizLicenseFile` で PDF はそのまま dataURL 化、 画像は `compressImage` で圧縮。 リアルタイム + 提出時の両方でバリデーション (`bizLicensePreview` / `bizLicenseNumber.trim()` 必須)。 提出 body に `licenseImageBase64` + `licenseNumber` 追加。 localStorage draft には番号のみ保存 (画像はサイズ大なので除外)。
2. **サーバ側必須化** (`stores.ts /stores/apply` L211-233): 共通正規表現 `LICENSE_DATA_URL_RE = /^data:(image\/(?:jpeg|jpg|png|webp|heic|heif)|application\/pdf);base64,(.+)$/s` を関数頭で定義。 `existingStripeAccountId != null` の場合 `licenseImageBase64` (regex match) と `licenseNumber.trim()` を必須化し、 欠落時 400 `license_image_required` / `license_number_required` を返す (旧クライアント / 改ざん耐性)。 同正規表現を Supabase Storage アップロード (L282) と Stripe Files API 復元 (L341) でも使用し不整合排除。
3. **PDF 提出対応** (`stores.ts`): 過去の data URL パーサが `image/[\w+]` 固定で `application/pdf` を弾いていた問題を修正。 Supabase 拡張子分岐に `pdf` / `heic` / `heif` 追加、 Stripe Files の `fileExt` も `application/pdf → 'pdf'` を含む。
4. **重複ブロック撤廃** (`stores.ts /stores/apply` L235-272): 別オーナの同店名+同住所を 409 でブロックしていた `storeIdentityKey` 判定を警告ログのみに変更 (admin dashboard で精査する運用)。 フロントの 409 'store_duplicate' ハンドラも削除。
5. **Stripe 再有効化フロー** (`stores.ts` + `StoreOnboarding.tsx`): /apply で `existingStripeAccountId` 取得後 `stripe.accounts.retrieve` で `charges_enabled` / `payouts_enabled` を取得し DB の `stripeChargesEnabled` / `stripePayoutsEnabled` に反映。 retrieve 失敗時も継続 (try/catch + null 既定)。 レスポンスに `requiresStripeReauth` フラグを含め、 フロントは isInherited && requiresStripeReauth=true なら `/store/bank-setup` へ誘導 (再有効化フロー)、 false なら従来通り `/mypage` へ。
- architect 評価: 1回目 FAIL (サーバ必須化欠落 + PDF パース失敗) → 修正後 2回目 PASS。 TS チェック (`api-server` / `rescueat`) 両方クリア。

### 地図ロード高速化 (iOS WebView 体感速度向上)
- **`index.cap.html`**: Google Maps 用 `preconnect` + `dns-prefetch` 追加 (`maps.googleapis.com` / `maps.gstatic.com`)。 iOS アプリ起動直後に DNS/TLS ハンドシェイクを先行実施 (`fetch` は走らないため帯域消費なし)
- **`Home.tsx` FloatingMapButton**: 
  - マウント時 `requestIdleCallback` (非対応 = `setTimeout(1500)` フォールバック) で `loadGoogleMapsScript()` を idle prefetch
  - `onPointerEnter` / `onTouchStart` でユーザー意図検知時にも再トリガ (idle が間に合わなかった場合の保険)
  - cleanup で `cancelIdleCallback` / `clearTimeout` 実装
- **二重ロード防止**: `maps-loader.ts` の既存 `_promise` 単一再利用により、 多数トリガでも script 注入は 1 回のみ
- **architect PASS**: 副作用 (位置情報競合・メインスレッド・メモリ・TS strict・hooks 依存配列) すべて問題なし。 Next action 提案: ① 実機で「Home→即 Map」と「数秒待機後 Map」の TTI 比較計測、 ② 低速回線時 `navigator.connection?.saveData` で idle prefetch を条件分岐 (将来検討)

### 世界品質パス Phase 1+2+3 + Favorites race 完全防御 (9 ラウンド)
- **Phase 1 — Critical UX**:
  - `not-found.tsx`: 英語の開発者向けメッセージ → 日本語の温かい案内 + ホーム/戻るボタン (暖色グラデ + safe-area + framer-motion)
  - `App.tsx`: `/register` を `/signup` の互換エイリアスとして追加 (古いブックマーク・外部リンク対策)
  - `alert()` → toast 置換: `Home.tsx` (位置情報拒否ガイド)、 `Orders.tsx` (印刷案内・コピー成功・シェア非対応)
  - `lib/error-message.ts` 新設 (`toUserErrorMessage`): RegisterStore/OrderTicket の生 `err.message` を HTTP status 別 (401/403/404/408/409/413/429/5xx + TypeError network) の自然日本語メッセージに変換
- **Phase 2 — Performance**:
  - `<img>` 22 ファイルに `loading="lazy" decoding="async"` 一括追加 (LCP/モバイル通信改善)
  - `lib/maps-loader.ts`: `gm_authFailure` を全環境共通化、 `window.__gmAuthFailed` フラグ + `CustomEvent('gm-auth-failure')` を dispatch
  - `Map.tsx`: auth failure event リッスン + `authFailedRef` で `tilesloaded`/3秒 safety timer の `setStatus('ready')` 上書きをガード、 status='error' 時は再読込ボタン付き案内 UI を表示
- **Phase 3 — UX Polish (FavoritesContext race condition 完全防御)**:
  全 9 ラウンドの architect レビューで指摘された並行性 race を順次解消:
  1. **基本ロールバック**: 4xx/5xx で楽観 UI を反対方向トグル再適用、 409 は許容
  2. **stale ref**: `favoritesRef = useRef<Set<number>>` を `setFavorites` updater 内で**即時同期** (useEffect 経由は同一フレーム連続トグルで stale)
  3. **stale rollback**: `opSeqRef = useRef<Map<storeId, number>>` で storeId 単位の操作シーケンス、 古い失敗が新意図を巻戻すのを防ぐ
  4. **cross-user contamination**: `authEpochRef` (userId 変更で +1) + `inFlightControllersRef` (`AbortController` Set) で旧ユーザーの in-flight を全 abort、 catch で epoch 不一致なら破棄
  5. **sync useEffect 順序**: `authEpochRef` reset useEffect を sync useEffect の**前に宣言** (useEffect は宣言順実行)、 sync 内に epoch capture + 2 段階チェック + AbortController + cleanup return
  6. **lost-update + delete-revival**: `mutationSeqRef` (toggle で +1、 sync 開始時 capture、 commit 直前に不一致なら commit skip) + `pendingDeletesRef` (削除 tombstone を merged から引く)
  7. **server-poisoning**: sync の `toAdd` を `favoritesRef.current` ベース + `pendingDeletes` filter、 各 POST 発行直前に最終チェック、 POST 中に delete されたら follow-up DELETE を発行
  8. **DELETE-clear-race**: follow-up DELETE 条件に `pendingDeletesRef.has(id) || !favoritesRef.current.has(id)` の OR ガード (DELETE in-flight + 完了済みの両方を検知)
  9. **re-ADD 後の stale DELETE**: follow-up DELETE 発行直前に再度 latest intent をチェックして skip
- **対象外スコープ** (意図的): AdminDashboard alert (管理者専用)、 巨大ページ分割、 i18n、 デザイン全面リフ
- **検証**: TypeScript strict check OK / 全画面 screenshot OK / 26 ファイル変更 + 新規 1 (`lib/error-message.ts`)、 +424/-96 行

### iOS デプロイ前 最終クリーンアップ — Vite Fast Refresh 警告完全消去
- ブラウザコンソールに大量の `[vite] Could not Fast Refresh ("useFavorites" export is incompatible)` 警告が出ていた (`FavoritesContext.tsx` から Provider component と `useFavorites` hook を同時 export していたため、 react-refresh の component-only-export 制約違反)
- **3 ファイルに分離**:
  1. `contexts/FavoritesContextValue.ts` (新規 .ts) — `FavoritesContext` object + `FavoritesContextValue` 型のみ
  2. `hooks/useFavorites.ts` (新規 .ts) — `useFavorites` hook のみ (context は (1) から import)
  3. `contexts/FavoritesContext.tsx` — `FavoritesProvider` のみに絞る (context は (1) から import)
- import 元 3 ファイル (`BagDetail.tsx`, `BagCard.tsx`, `FavoritesPage.tsx`) を `@/hooks/useFavorites` に書き換え
- **検証**: TS strict check OK / HMR 後のブラウザコンソール完全クリーン (vite connecting/connected/auth event のみ、 警告 0) / architect レビュー Pass「9 ラウンドの race fix 全要素 (favoritesRef/opSeqRef/authEpochRef/AbortController/mutationSeqRef/pendingDeletesRef/follow-up DELETE) は全て生存、 context 参照同一性も保たれる」
- `AuthContext` / `MyStoresContext` も同パターンだが、 現状ログでは警告未発火 (頻繁に編集されないため)、 `useAuth` は 50+ ファイルから import されており予防的リファクタは破壊リスク大なので **iOS デプロイ前は対応不要** (architect 確認済)

### App Store 申請前 最終QA対応 (優先度高+中)
- **Info.plist**: `ITSAppUsesNonExemptEncryption=false` 追加 → Apple Export Compliance の毎回ダイアログをスキップ (HTTPS 標準暗号のみで独自暗号未使用のため `false` で正)
- **pbxproj ビルド番号バンプ**: `CURRENT_PROJECT_VERSION = 1 → 101` (Debug/Release 両方)。`MARKETING_VERSION = 1.0` は据え置き (再提出時の標準運用)
- **patch 配布**: `.local/app-store-submission/preflight.patch` (SHA256: `65bf49692feb4d6ec3b145f3cad268db8c0803ec2c4cdd62f2a7c8f6e64d820a`) を Mac 側で `git apply` 適用
- **APP_STORE_SUBMISSION.md 正本化**: 既存 `artifacts/rescueat/APP_STORE_SUBMISSION.md` を申請の唯一の正本に統一。年齢区分を **4+ → 12+ に修正** (UGC 機能あり=`StoreReviewSheet.tsx` の通報・ブロック実装のため、4+ は不可)。pbxproj 衝突予防ルール (Xcode で Signing 変更 / cap:sync 後は必ず `git diff` 確認) も明文化
- **補助ドキュメント**: `.local/app-store-submission/SUBMISSION_PACKAGE.md` は補足扱いに変更 (Review Notes 詳細版、リジェクト対処早見表)
- **architect レビュー結果**: コード変更は妥当。提出ドキュメントの一本化と patch ファイルの実配置で指摘事項を解消済み

### 申請パッケージ準備状況
- ✅ プライバシー (`/privacy`)・利用規約 (`/terms`)・特商法 (`/legal` および `/tokusho`) 完備、HTTPS+HSTS、フッター3箇所にリンク
- ✅ Stripe = 物理食品店舗受取 (Guideline 3.1.5(a) 該当)、`REVIEW_BYPASS` 実装で 2.3.10 対応
- ✅ アカウント削除 (`MyPage.tsx` `DeleteAccountModal`)、5.1.1(v) 対応
- ✅ UGC モデレーション (通報・ブロック・規約)、Guideline 1.2 対応
- ⚠️ 法人化前のため特商法の住所・電話は「請求があれば開示」維持。申請時 Apple 審査員から要求された場合は Mac 側で `TokushoPage.tsx ROWS` を更新

## Recent Updates (2026-04-29)

### 売上¥0バグ + 店舗カスタムアイコン機能
- **売上¥0バグ修正**: `routes/reservations.ts` GET /reservations が常に `userId` フィルタ強制 → 店舗オーナーが自店売上見ても本人購入分だけ返却。`?storeId=X` + `stores.ownerId === req.authUser.id` の場合のみ `userId` フィルタを外す `isStoreOwnerView` 分岐を追加。
- **店舗カスタムアイコン機能**: 
  - DB: `stores.icon_url TEXT` カラム追加 (`storeExtraCols` 経由)
  - API: `PUT /api/stores/:storeId/profile` の allowed リストに `iconUrl` + `category` 追加
  - UI: `StoreProfileEdit.tsx` に「地図のピンに使うアイコン」セクション (円形プレビュー、選択/削除ボタン、サイズ上限 3MB)
  - Map: `Map.tsx` の `makeIconPinUrl(iconUrl, isActive)` でカスタム円形フレームピン (オレンジ枠/グレー枠) を SVG 生成。`safeIconHref()` で http(s) 限定 + XML 属性エスケープによる SVG injection 防御。`store.iconUrl` 不正/未設定時はカテゴリ絵文字ピンへフォールバック
- **クライアント側型同期**: `lib/api-client-react` は composite TS project なので `tsc -b --force` でリビルド必要 (`dist/*.d.ts` が project reference 経由で参照される)

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
