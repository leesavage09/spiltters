import React, { createContext, useContext, useEffect, useState } from "react";
import { openDatabaseSync } from "expo-sqlite";
import { drizzle } from "drizzle-orm/expo-sqlite";
import type { ExpoSQLiteDatabase } from "drizzle-orm/expo-sqlite";
import * as schema from "./schema";
import { migrateDatabase } from "./migrate";

export type Database = ExpoSQLiteDatabase<typeof schema>;

const DatabaseContext = createContext<Database | null>(null);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [db, setDb] = useState<Database | null>(null);

  useEffect(() => {
    const sqliteDb = openDatabaseSync("splitters.db");
    migrateDatabase(sqliteDb);
    const drizzleDb = drizzle(sqliteDb, { schema });
    setDb(drizzleDb);
  }, []);

  if (!db) return null;

  return (
    <DatabaseContext.Provider value={db}>{children}</DatabaseContext.Provider>
  );
};

export function useDatabase(): Database {
  const db = useContext(DatabaseContext);
  if (!db) throw new Error("useDatabase must be used within DatabaseProvider");
  return db;
}
