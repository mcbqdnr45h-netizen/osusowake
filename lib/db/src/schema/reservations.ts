import { pgTable, serial, integer, text, real, timestamp, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { storesTable } from "./stores";
import { surpriseBagsTable } from "./bags";

export const reservationStatusEnum = pgEnum("reservation_status", [
  "pending",
  "confirmed",
  "picked_up",
  "cancelled",
]);

export const paymentStatusEnum = pgEnum("payment_status", [
  "unpaid",
  "paid",
  "refunded",
]);

export const reservationsTable = pgTable("reservations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bagId: integer("bag_id").notNull().references(() => surpriseBagsTable.id),
  storeId: integer("store_id").notNull().references(() => storesTable.id),
  quantity: integer("quantity").notNull().default(1),
  totalPrice: real("total_price").notNull(),
  // 商品代金 (= bag.discountedPrice * quantity, 5%システム利用料込みの totalPrice とは別管理)。
  // 旧データでは NULL の可能性があり、その場合は totalPrice を商品代金と見なすフォールバックを用いる。
  merchandiseAmount: real("merchandise_amount"),
  status: reservationStatusEnum("status").notNull().default("pending"),
  paymentIntentId: text("payment_intent_id"),
  paymentStatus: paymentStatusEnum("payment_status").notNull().default("unpaid"),
  pickupCode: text("pickup_code"),
  // ★ status が picked_up に遷移した時刻 (月次ランキング集計用)。
  //   レガシー行は NULL — 集計側で createdAt にフォールバックする。
  pickedUpAt: timestamp("picked_up_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ id: true, createdAt: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
