import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

// Operations log — append-only, source of truth
export const operations = sqliteTable("operations", {
  id: text("id").primaryKey(),
  type: text("type").notNull(),
  splitId: text("split_id").notNull(),
  entityId: text("entity_id").notNull(),
  userId: text("user_id").notNull(),
  hlcTimestamp: text("hlc_timestamp").notNull(),
  payload: text("payload").notNull(), // JSON string
  serverSeq: integer("server_seq"),
  synced: integer("synced").notNull().default(0), // 0=pending, 1=synced
});

// Materialized views — derived from operations, for fast reads
export const splits = sqliteTable("splits", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  emoji: text("emoji").notNull(),
  deleted: integer("deleted").notNull().default(0),
});

export const splitMembers = sqliteTable("split_members", {
  splitId: text("split_id").notNull(),
  userId: text("user_id").notNull(),
});

export const expenses = sqliteTable("expenses", {
  id: text("id").primaryKey(),
  splitId: text("split_id").notNull(),
  title: text("title").notNull(),
  amount: integer("amount").notNull(),
  currency: text("currency").notNull(),
  date: text("date").notNull(),
  paidById: text("paid_by_id").notNull(),
  deleted: integer("deleted").notNull().default(0),
});

export const expenseShares = sqliteTable("expense_shares", {
  expenseId: text("expense_id").notNull(),
  userId: text("user_id").notNull(),
  amount: integer("amount").notNull(),
});

// Sync state — tracks last received server sequence per split
export const syncState = sqliteTable("sync_state", {
  splitId: text("split_id").primaryKey(),
  lastServerSeq: integer("last_server_seq").notNull().default(0),
});
