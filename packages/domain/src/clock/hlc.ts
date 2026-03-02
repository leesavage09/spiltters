// Hybrid Logical Clock (HLC)
//
// Combines a physical wall-clock timestamp with a logical counter to provide
// causal ordering even when clocks drift between devices.
//
// Timestamp format: "{physicalMs}:{counter}:{nodeId}"
// Example: "1709312400000:0:abc123"
//
// Ordering: compare physical time first, then counter, then nodeId for tie-breaking.

export interface HLCState {
  physicalMs: number;
  counter: number;
  nodeId: string;
}

export interface HLCTimestamp {
  physicalMs: number;
  counter: number;
  nodeId: string;
}

export function createHLC(nodeId: string): HLCState {
  return {
    physicalMs: Date.now(),
    counter: 0,
    nodeId,
  };
}

export function tickHLC(state: HLCState): { state: HLCState; timestamp: string } {
  const now = Date.now();
  const newPhysical = Math.max(state.physicalMs, now);
  const newCounter = newPhysical === state.physicalMs ? state.counter + 1 : 0;

  const newState: HLCState = {
    physicalMs: newPhysical,
    counter: newCounter,
    nodeId: state.nodeId,
  };

  return { state: newState, timestamp: formatHLC(newState) };
}

export function receiveHLC(local: HLCState, remoteTimestamp: string): HLCState {
  const remote = parseHLC(remoteTimestamp);
  const now = Date.now();
  const newPhysical = Math.max(local.physicalMs, remote.physicalMs, now);

  let newCounter: number;
  if (newPhysical === local.physicalMs && newPhysical === remote.physicalMs)
    newCounter = Math.max(local.counter, remote.counter) + 1;
  else if (newPhysical === local.physicalMs)
    newCounter = local.counter + 1;
  else if (newPhysical === remote.physicalMs)
    newCounter = remote.counter + 1;
  else
    newCounter = 0;

  return {
    physicalMs: newPhysical,
    counter: newCounter,
    nodeId: local.nodeId,
  };
}

export function formatHLC(state: HLCState): string {
  const paddedMs = state.physicalMs.toString().padStart(15, "0");
  const paddedCounter = state.counter.toString().padStart(6, "0");
  return `${paddedMs}:${paddedCounter}:${state.nodeId}`;
}

export function parseHLC(timestamp: string): HLCTimestamp {
  const parts = timestamp.split(":");
  if (parts.length < 3) throw new Error(`Invalid HLC timestamp: ${timestamp}`);

  return {
    physicalMs: parseInt(parts[0]!, 10),
    counter: parseInt(parts[1]!, 10),
    nodeId: parts.slice(2).join(":"),
  };
}

export function compareHLCTimestamps(a: string, b: string): number {
  const pa = parseHLC(a);
  const pb = parseHLC(b);

  if (pa.physicalMs !== pb.physicalMs)
    return pa.physicalMs < pb.physicalMs ? -1 : 1;

  if (pa.counter !== pb.counter)
    return pa.counter < pb.counter ? -1 : 1;

  if (pa.nodeId < pb.nodeId) return -1;
  if (pa.nodeId > pb.nodeId) return 1;

  return 0;
}
