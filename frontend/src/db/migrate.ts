import type { SQLiteDatabase } from "expo-sqlite";

export function migrateDatabase(db: SQLiteDatabase) {
  db.execSync(`
    CREATE TABLE IF NOT EXISTS operations (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      split_id TEXT NOT NULL,
      entity_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      hlc_timestamp TEXT NOT NULL,
      payload TEXT NOT NULL,
      server_seq INTEGER,
      synced INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS splits (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      emoji TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS split_members (
      split_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      PRIMARY KEY (split_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id TEXT PRIMARY KEY,
      split_id TEXT NOT NULL,
      title TEXT NOT NULL,
      amount INTEGER NOT NULL,
      currency TEXT NOT NULL,
      date TEXT NOT NULL,
      paid_by_id TEXT NOT NULL,
      deleted INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS expense_shares (
      expense_id TEXT NOT NULL,
      user_id TEXT NOT NULL,
      amount INTEGER NOT NULL,
      PRIMARY KEY (expense_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS sync_state (
      split_id TEXT PRIMARY KEY,
      last_server_seq INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS hlc_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_operations_split_synced
      ON operations(split_id, synced);

    CREATE INDEX IF NOT EXISTS idx_operations_split_seq
      ON operations(split_id, server_seq);

    CREATE INDEX IF NOT EXISTS idx_expenses_split
      ON expenses(split_id);
  `);
}
