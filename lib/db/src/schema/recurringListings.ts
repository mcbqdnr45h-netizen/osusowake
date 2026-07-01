import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

/**
 * 定期出品（毎日自動公開）テンプレート。
 * 店が一度登録すると、 publishTime / daysOfWeek に従ってサーバーが毎日自動で
 * surprise_bags に1件 INSERT する（recurring-publisher.ts）。
 *
 * 日付系は JST の "YYYY-MM-DD" 文字列で持つ（タイムゾーン変換の取り違えを構造的に防ぐ）。
 */
export const recurringListingsTable = pgTable("recurring_listings", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),

  // ── テンプレ商品情報（surprise_bags と同型）──
  title: text("title").notNull(),
  description: text("description"),
  // 円は整数（DBは integer）。
  originalPrice: integer("original_price").notNull(),
  discountedPrice: integer("discounted_price").notNull(),
  stockCount: integer("stock_count").notNull().default(0),
  pickupStart: text("pickup_start"),
  pickupEnd: text("pickup_end"),
  // 2部制(受取2枠): 休憩をはさむ店向けの2枠目。 任意(NULL=1枠のみ)。 "HH:MM"。
  pickupStart2: text("pickup_start_2"),
  pickupEnd2: text("pickup_end_2"),
  imageUrl: text("image_url"),
  category: text("category"),
  allergyInfo: text("allergy_info"),
  pickupNote: text("pickup_note"),
  itemType: text("item_type").default("bag"),

  // ── スケジュール ──
  /** 公開時刻 JST "HH:MM"（例 "21:00"） */
  publishTime: text("publish_time").notNull(),
  /** 受け取る曜日(=営業日) bitmask: bit0=日 bit1=月 … bit6=土。 127=毎日。
   *  ★ v2 で意味を「公開曜日」→「受け取り曜日」に変更（定休日の取り違え防止）。 */
  daysOfWeek: integer("days_of_week").notNull().default(127),
  /** 受け取り日の前日に出品するか。 true=前日の夜に自動出品(翌日受け取り) / false=当日に出品(同日受け取り) */
  pickupNextDay: boolean("pickup_next_day").notNull().default(false),
  /** テンプレ自体の有効/無効（店が一時的に完全停止できる） */
  isActive: boolean("is_active").notNull().default(true),
  /** 在庫持ち越しモード。 true=毎日リセットせず1回だけ出品し、 在庫は店が手動更新（変動店向け）。
   *  false(既定)=毎日 固定数で自動出品（安定店向け・従来挙動）。 */
  carryOverStock: boolean("carry_over_stock").notNull().default(false),
  /** 「今夜だけ停止」: この JST 日付(YYYY-MM-DD)の公開のみスキップ (レガシー・単日) */
  skipDate: text("skip_date"),
  /** 休みカレンダー: スキップする JST 日付のリスト ("YYYY-MM-DD" カンマ区切り)。
   *  不定休・特定日の休みを店が指定。 publisher は今日がこの中にあれば公開しない。 */
  skipDates: text("skip_dates"),
  /** 冪等性キー: 最後に自動公開した JST 日付(YYYY-MM-DD)。 同日二重公開を防ぐ */
  lastPublishedDate: text("last_published_date"),

  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertRecurringListingSchema = createInsertSchema(recurringListingsTable).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastPublishedDate: true,
});
export type InsertRecurringListing = z.infer<typeof insertRecurringListingSchema>;
export type RecurringListing = typeof recurringListingsTable.$inferSelect;
