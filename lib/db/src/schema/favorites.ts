import { pgTable, serial, text, integer, timestamp, unique } from "drizzle-orm/pg-core";
import { storesTable } from "./stores";

export const favoritesTable = pgTable("favorites", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  storeId: integer("store_id").notNull().references(() => storesTable.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
}, (t) => ({
  uniq: unique("favorites_user_store_uniq").on(t.userId, t.storeId),
}));

export type Favorite = typeof favoritesTable.$inferSelect;
