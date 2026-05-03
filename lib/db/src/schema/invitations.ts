import { pgTable, serial, text, timestamp } from "drizzle-orm/pg-core";

export const invitationsTable = pgTable("invitations", {
  id:         serial("id").primaryKey(),
  inviterId:  text("inviter_id").notNull(),
  code:       text("code").notNull().unique(),
  inviteeId:  text("invitee_id"),
  acceptedAt: timestamp("accepted_at"),
  createdAt:  timestamp("created_at").notNull().defaultNow(),
});

export type Invitation = typeof invitationsTable.$inferSelect;
