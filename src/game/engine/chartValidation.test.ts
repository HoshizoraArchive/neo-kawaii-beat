import { describe, expect, it } from "vitest";
import { validateChart } from "./chartValidation";
import type { ChartV1, Lane, Note, SongDefinition } from "./types";

const songs: SongDefinition[] = [
  {
    id: "song",
    title: "Song",
    artist: "Artist",
    bpm: 120,
    durationMs: 10_000,
    audio: { kind: "generated", generator: "demo-v1" },
    source: { kind: "official" },
    jacketKind: "generated-css",
  },
];

const validChart: ChartV1 = {
  version: 1,
  songId: "song",
  difficulty: "easy",
  level: 1,
  offsetMs: 0,
  approachTimeMs: 1_500,
  notes: [
    { id: "a", type: "tap", lane: 0, timeMs: 1_000 },
    { id: "b", type: "hold", lane: 1, timeMs: 2_000, durationMs: 500 },
    { id: "c", type: "tap", lane: 1, timeMs: 2_600 },
  ],
};

describe("validateChart", () => {
  it("accepts a valid chart", () => {
    expect(validateChart(validChart, songs).ok).toBe(true);
  });

  it("rejects lane outside 0-3", () => {
    const chart = chartWith([{ id: "bad", type: "tap", lane: 4 as unknown as Lane, timeMs: 1_000 }]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });

  it("rejects negative timeMs", () => {
    const chart = chartWith([{ id: "bad", type: "tap", lane: 0 as Lane, timeMs: -1 }]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });

  it("rejects invalid durationMs", () => {
    const chart = chartWith([{ id: "bad", type: "hold", lane: 0 as Lane, timeMs: 1_000, durationMs: 0 }]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });

  it("rejects duplicated IDs", () => {
    const chart = chartWith([
      { id: "dup", type: "tap", lane: 0 as Lane, timeMs: 1_000 },
      { id: "dup", type: "tap", lane: 1 as Lane, timeMs: 1_500 },
    ]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });

  it("rejects unsorted notes", () => {
    const chart = chartWith([
      { id: "late", type: "tap", lane: 0 as Lane, timeMs: 2_000 },
      { id: "early", type: "tap", lane: 1 as Lane, timeMs: 1_500 },
    ]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });

  it("rejects same-lane hold overlap", () => {
    const chart = chartWith([
      { id: "hold", type: "hold", lane: 2 as Lane, timeMs: 1_000, durationMs: 1_000 },
      { id: "overlap", type: "tap", lane: 2 as Lane, timeMs: 1_500 },
    ]);
    expect(validateChart(chart, songs).ok).toBe(false);
  });
});

function chartWith(notes: Note[]): ChartV1 {
  return {
    ...validChart,
    notes,
  };
}
