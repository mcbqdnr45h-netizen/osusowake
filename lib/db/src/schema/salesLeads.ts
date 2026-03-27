import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const salesLeadsTable = pgTable("sales_leads", {
  id:          serial("id").primaryKey(),
  reportedBy:  text("reported_by"),
  storeName:   text("store_name").notNull(),
  location:    text("location").notNull(),
  memo:        text("memo"),
  status:      text("status").notNull().default("new"),
  createdAt:   timestamp("created_at").notNull().defaultNow(),
});

export type SalesLead = typeof salesLeadsTable.$inferSelect;
