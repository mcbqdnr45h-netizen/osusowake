import { pgTable, serial, integer, text, real, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";

export const surpriseBagsTable = pgTable("surprise_bags", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id),
  title: text("title").notNull(),
  description: text("description"),
  originalPrice: real("original_price").notNull(),
  discountedPrice: real("discounted_price").notNull(),
  stockCount: integer("stock_count").notNull().default(0),
  pickupStart: text("pickup_start"),
  pickupEnd: text("pickup_end"),
  imageUrl: text("image_url"),
  category: text("category"),
  isActive: boolean("is_active").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertBagSchema = createInsertSchema(surpriseBagsTable).omit({ id: true, createdAt: true });
export type InsertBag = z.infer<typeof insertBagSchema>;
export type SurpriseBag = typeof surpriseBagsTable.$inferSelect;
