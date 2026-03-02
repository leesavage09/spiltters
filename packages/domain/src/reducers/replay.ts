import { compareHLCTimestamps } from "../clock/hlc.js";
import type { Operation } from "../operations/schemas.js";
import type { SplitMaterializedState } from "../state/types.js";
import { emptyMaterializedState } from "../state/types.js";
import { reduceSplitOperation } from "./split.js";

export function replayOperations(operations: Operation[]): SplitMaterializedState {
  const sorted = [...operations].sort((a, b) =>
    compareHLCTimestamps(a.hlcTimestamp, b.hlcTimestamp),
  );

  let state = emptyMaterializedState();
  for (const op of sorted) {
    state = reduceSplitOperation(state, op);
  }

  return state;
}
