import { pgTable, serial, text, real, boolean, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const storeCategoryEnum = pgEnum("store_category", [
  "restaurant",
  "bakery",
  "cafe",
  "supermarket",
  "convenience",
  "other",
  "meals",
  "bakery_sweets",
  "ingredients",
]);

export const storeStatusEnum = pgEnum("store_status", [
  "pending",
  "approved",
  "rejected",
  "pending_review",
  "applied",
]);

export const storesTable = pgTable("stores", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  address: text("address").notNull(),
  city: text("city").notNull(),
  category: storeCategoryEnum("category").notNull().default("other"),
  lat: real("lat").notNull(),
  lng: real("lng").notNull(),
  imageUrl: text("image_url"),
  // ★ 地図ピン用カスタムアイコン (URL)。未設定時はカテゴリ絵文字ピンへフォールバック。
  iconUrl: text("icon_url"),
  phone: text("phone"),
  openTime: text("open_time"),
  closeTime: text("close_time"),
  rating: real("rating"),
  isActive: boolean("is_active").notNull().default(true),
  status: storeStatusEnum("status").notNull().default("approved"),
  ownerId: text("owner_id"),
  stripeAccountId: text("stripe_account_id"),
  // Onboarding compliance fields
  licenseNumber: text("license_number"),
  licenseImageUrl: text("license_image_url"),
  idImageUrl: text("id_image_url"),
  pledgeSigned: boolean("pledge_signed").notNull().default(false),
  approvalEmailSent: boolean("approval_email_sent").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  // Profile & hours
  holiday: text("holiday"),
  pickupHours: text("pickup_hours"),
  // 特定商取引法 legal info
  legalName: text("legal_name"),
  legalRepresentative: text("legal_representative"),
  legalAddress: text("legal_address"),
  legalPhone: text("legal_phone"),
  legalEmail: text("legal_email"),
  legalOther: text("legal_other"),
  // 審査却下理由（管理者が入力）
  rejectionReason: text("rejection_reason"),
  // Stripe アカウントの決済可否（bank-setup / KYC完了後に更新）
  stripeChargesEnabled: boolean("stripe_charges_enabled"),
  // Stripe アカウントの入金可否（bank-setup / KYC完了後に更新）
  stripePayoutsEnabled: boolean("stripe_payouts_enabled"),
  stripeKycAdminEmailSent: boolean("stripe_kyc_admin_email_sent").notNull().default(false),
  // Stripe Files API でアップロードした営業許可証のファイルID（file_...）
  stripeLicenseFileId: text("stripe_license_file_id"),
  // Stripe の past_due に external_account が含まれている場合に true → 口座の再登録が必要
  stripeNeedsBankReregister: boolean("stripe_needs_bank_reregister").default(false),
  // 営業許可証画像アップロード失敗追跡（神モード silent fail 検知用）
  licenseUploadFailed: boolean("license_upload_failed").default(false),
  licenseUploadError: text("license_upload_error"),
  licenseUploadAttemptedAt: timestamp("license_upload_attempted_at", { withTimezone: true }),
  // 適格請求書発行事業者登録番号 (インボイス制度 / Qualified Invoice System)
  // 形式: T + 13桁の数字 (例: T1234567890123)。 任意。
  // 入力されている店舗の電子領収書には自動で T 番号を表示し適格請求書として機能。
  // 未入力時は領収書に「※当店は適格請求書発行事業者ではありません」 を表示。
  qualifiedInvoiceNumber: text("qualified_invoice_number"),
  // ★ 国税庁適格請求書発行事業者公表サイト Web-API で検証した公表名 (法人/屋号)。
  //   PUT /stores/:id/profile で qualifiedInvoiceNumber を保存する際、
  //   NTA_INVOICE_APP_ID が設定されていれば NTA API を呼び出し、
  //   - 取得成功 → 本カラムに公表名 + verifiedAt を保存し領収書発行元として表示
  //   - 取得失敗 (登録なし/取消等) → 400 で拒否
  //   - SECRET 未設定時 → 形式チェックのみで通し、 本カラムは null のまま
  //   未検証 (null) の場合は領収書発行元に T 番号のみ表示し、 公表名は出さない。
  qualifiedInvoiceName: text("qualified_invoice_name"),
  qualifiedInvoiceVerifiedAt: timestamp("qualified_invoice_verified_at", { withTimezone: true }),
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({ id: true, createdAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
