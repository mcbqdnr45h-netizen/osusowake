import { pgTable, serial, text, timestamp, unique } from "drizzle-orm/pg-core";

// ★ Android (FCM) のデバイストークン保管。 APNs (iOS) と並列の構造で、
//    push.ts:sendPushToUser が user_id をキーに両プラットフォームへ並行送信する。
export const fcmRegistrationsTable = pgTable(
  "fcm_registrations",
  {
    id: serial("id").primaryKey(),
    userId: text("user_id").notNull(),
    deviceToken: text("device_token").notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
    updatedAt: timestamp("updated_at").notNull().defaultNow(),
  },
  (t) => ({
    userTokenUnique: unique("fcm_user_token_uq").on(t.userId, t.deviceToken),
  }),
);
