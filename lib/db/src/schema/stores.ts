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
});

export const insertStoreSchema = createInsertSchema(storesTable).omit({ id: true, createdAt: true });
export type InsertStore = z.infer<typeof insertStoreSchema>;
export type Store = typeof storesTable.$inferSelect;
