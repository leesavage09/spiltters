import { describe, it, expect } from "vitest";
import {
  createHLC,
  tickHLC,
  receiveHLC,
  compareHLCTimestamps,
  formatHLC,
  parseHLC,
} from "../clock/hlc.js";

describe("HLC", () => {
  it("creates an HLC with the given nodeId", () => {
    const hlc = createHLC("node-1");
    expect(hlc.nodeId).toBe("node-1");
    expect(hlc.counter).toBe(0);
    expect(hlc.physicalMs).toBeGreaterThan(0);
  });

  it("tick produces monotonically increasing timestamps", () => {
    let hlc = createHLC("node-1");
    const timestamps: string[] = [];

    for (let i = 0; i < 10; i++) {
      const result = tickHLC(hlc);
      hlc = result.state;
      timestamps.push(result.timestamp);
    }

    for (let i = 1; i < timestamps.length; i++) {
      expect(compareHLCTimestamps(timestamps[i - 1]!, timestamps[i]!)).toBe(-1);
    }
  });

  it("increments counter when physical time does not advance", () => {
    let hlc = createHLC("node-1");
    // Force same physical time by setting it to the future
    hlc.physicalMs = Date.now() + 100_000;
    hlc.counter = 0;

    const t1 = tickHLC(hlc);
    expect(t1.state.counter).toBe(1);

    const t2 = tickHLC(t1.state);
    expect(t2.state.counter).toBe(2);
  });

  it("resets counter when physical time advances", () => {
    let hlc = createHLC("node-1");
    hlc.physicalMs = Date.now() - 100_000; // Past time
    hlc.counter = 42;

    const result = tickHLC(hlc);
    expect(result.state.counter).toBe(0);
    expect(result.state.physicalMs).toBeGreaterThanOrEqual(Date.now() - 1);
  });

  it("receive merges local and remote clocks", () => {
    const local = createHLC("local");
    const remote = createHLC("remote");

    // Advance remote clock into the future
    const remoteAdvanced = { ...remote, physicalMs: Date.now() + 50_000, counter: 5 };
    const remoteTimestamp = formatHLC(remoteAdvanced);

    const merged = receiveHLC(local, remoteTimestamp);
    expect(merged.physicalMs).toBe(remoteAdvanced.physicalMs);
    expect(merged.counter).toBe(6); // remote.counter + 1
    expect(merged.nodeId).toBe("local");
  });

  it("receive takes max counter when physical times are equal", () => {
    const now = Date.now() + 100_000; // Future so Date.now() won't exceed it
    const local = { physicalMs: now, counter: 3, nodeId: "local" };
    const remote = { physicalMs: now, counter: 7, nodeId: "remote" };

    const merged = receiveHLC(local, formatHLC(remote));
    expect(merged.physicalMs).toBe(now);
    expect(merged.counter).toBe(8); // max(3, 7) + 1
  });

  it("formatHLC and parseHLC are inverse operations", () => {
    const hlc = { physicalMs: 1709312400000, counter: 42, nodeId: "abc123" };
    const formatted = formatHLC(hlc);
    const parsed = parseHLC(formatted);

    expect(parsed.physicalMs).toBe(hlc.physicalMs);
    expect(parsed.counter).toBe(hlc.counter);
    expect(parsed.nodeId).toBe(hlc.nodeId);
  });

  it("compareHLCTimestamps orders by physical time first", () => {
    const a = formatHLC({ physicalMs: 1000, counter: 99, nodeId: "z" });
    const b = formatHLC({ physicalMs: 2000, counter: 0, nodeId: "a" });
    expect(compareHLCTimestamps(a, b)).toBe(-1);
    expect(compareHLCTimestamps(b, a)).toBe(1);
  });

  it("compareHLCTimestamps orders by counter when physical times are equal", () => {
    const a = formatHLC({ physicalMs: 1000, counter: 1, nodeId: "z" });
    const b = formatHLC({ physicalMs: 1000, counter: 2, nodeId: "a" });
    expect(compareHLCTimestamps(a, b)).toBe(-1);
  });

  it("compareHLCTimestamps orders by nodeId as tiebreaker", () => {
    const a = formatHLC({ physicalMs: 1000, counter: 1, nodeId: "aaa" });
    const b = formatHLC({ physicalMs: 1000, counter: 1, nodeId: "bbb" });
    expect(compareHLCTimestamps(a, b)).toBe(-1);
    expect(compareHLCTimestamps(a, a)).toBe(0);
  });
});
