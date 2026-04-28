import { pgTable, serial, integer, text, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { storesTable } from "./stores";

export const reportTypeEnum = pgEnum("report_type", [
  "closed",
  "temp_closed",
  "wrong_hours",
  "wrong_info",
  "inappropriate_review",
  "other",
]);

export const reportsTable = pgTable("reports", {
  id: serial("id").primaryKey(),
  storeId: integer("store_id").notNull().references(() => storesTable.id),
  userId: text("user_id").notNull(),
  reportType: reportTypeEnum("report_type").notNull(),
  comment: text("comment"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Report = typeof reportsTable.$inferSelect;
