import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { storesTable } from "./stores";
import { reservationsTable } from "./reservations";

export const reviewsTable = pgTable("reviews", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  reservationId: integer("reservation_id").notNull().references(() => reservationsTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  rating: integer("rating").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  reply: text("reply"),
  repliedAt: timestamp("replied_at"),
});

export type Review = typeof reviewsTable.$inferSelect;
