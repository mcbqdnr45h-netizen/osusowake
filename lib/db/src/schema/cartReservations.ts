import { pgTable, serial, integer, text, timestamp } from "drizzle-orm/pg-core";
import { surpriseBagsTable } from "./bags";

export const cartReservationsTable = pgTable("cart_reservations", {
  id: serial("id").primaryKey(),
  userId: text("user_id").notNull(),
  bagId: integer("bag_id").notNull().references(() => surpriseBagsTable.id, { onDelete: "cascade" }),
  reservationId: integer("reservation_id"),
  quantity: integer("quantity").notNull().default(1),
  reservedAt: timestamp("reserved_at").notNull().defaultNow(),
  expiresAt: timestamp("expires_at").notNull(),
  status: text("status").notNull().default("active"),
});

export type CartReservation = typeof cartReservationsTable.$inferSelect;
