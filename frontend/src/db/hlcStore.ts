import type { SQLiteDatabase } from "expo-sqlite";
import { createHLC } from "@splitters/domain/src/clock/hlc";
import type { HLCState } from "@splitters/domain/src/clock/hlc";

const NODE_ID_KEY = "nodeId";

function generateNodeId(): string {
  const bytes = new Uint8Array(8);
  globalThis.crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

function getOrCreateNodeId(db: SQLiteDatabase): string {
  const row = db.getFirstSync<{ value: string }>(
    "SELECT value FROM hlc_state WHERE key = ?",
    NODE_ID_KEY,
  );
  if (row) return row.value;

  const nodeId = generateNodeId();
  db.runSync(
    "INSERT INTO hlc_state (key, value) VALUES (?, ?)",
    NODE_ID_KEY,
    nodeId,
  );
  return nodeId;
}

export function loadHLCState(db: SQLiteDatabase): HLCState {
  const nodeId = getOrCreateNodeId(db);
  return createHLC(nodeId);
}
