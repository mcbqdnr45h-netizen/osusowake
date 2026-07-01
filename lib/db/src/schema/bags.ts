import { pgTable, serial, integer, text, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { recurringListingsTable } from "./recurringListings";

export const surpriseBagsTable = pgTable("surprise_bags", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  description: text("description"),
  // 円は整数（DBは integer。 fk/型ドリフト防止のためスキーマも integer）。
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
  // 翌日受け取りか（定期出品の前日公開で true）。 買い手側で「明日受け取り」表示に使う。
  pickupNextDay: boolean("pickup_next_day").notNull().default(false),
  // どの定期出品テンプレから自動公開されたか（手動出品は null）。
  // テンプレを停止/削除した時に、 この列で対象バッグを特定して連動停止する。
  recurringListingId: integer("recurring_listing_id").references(() => recurringListingsTable.id, { onDelete: "set null" }),
  isActive: boolean("is_active").notNull().default(false),
  hiddenFromQuickPublish: boolean("hidden_from_quick_publish").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBagSchema = createInsertSchema(surpriseBagsTable).omit({ id: true, createdAt: true });
export type InsertBag = z.infer<typeof insertBagSchema>;
export type SurpriseBag = typeof surpriseBagsTable.$inferSelect;
