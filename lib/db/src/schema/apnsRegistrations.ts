import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

export const apnsRegistrationsTable = pgTable(
  "apns_registrations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    deviceToken: text("device_token").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userTokenUnique: unique("ar_user_token_uq").on(t.userId, t.deviceToken),
  }),
);
