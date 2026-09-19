import { describe, expect, it } from "vitest";
import { buildScoreResult, createJudgmentCounts, getMaxJudgmentCount, rankFromScore } from "./scoring";
import type { Note } from "./types";

const notes: Note[] = [
  { id: "tap-1", type: "tap", lane: 0, timeMs: 1_000 },
  { id: "hold-1", type: "hold", lane: 1, timeMs: 2_000, durationMs: 500 },
];

describe("scoring", () => {
  it("counts hold start and end as separate judgments", () => {
    expect(getMaxJudgmentCount(notes)).toBe(3);
  });

  it("returns max score for all perfect", () => {
    const counts = createJudgmentCounts();
    counts.perfect = 3;
    const result = buildScoreResult({
      counts,
      maxJudgmentCount: 3,
      combo: 3,
      maxCombo: 3,
      trend: { early: 0, late: 0, averageDeltaMs: 0 },
    });

    expect(result.score).toBe(1_000_000);
    expect(result.accuracy).toBe(100);
    expect(result.fullCombo).toBe(true);
    expect(result.allPerfect).toBe(true);
  });

  it("weights GREAT and MISS correctly", () => {
    const counts = createJudgmentCounts();
    counts.perfect = 1;
    counts.great = 1;
    counts.miss = 1;
    const result = buildScoreResult({
      counts,
      maxJudgmentCount: 3,
      combo: 0,
      maxCombo: 2,
      trend: { early: 1, late: 1, averageDeltaMs: 2 },
    });

    expect(result.score).toBe(583_333);
    expect(result.fullCombo).toBe(false);
    expect(result.allPerfect).toBe(false);
  });

  it("checks rank boundaries", () => {
    expect(rankFromScore(950_000)).toBe("S");
    expect(rankFromScore(949_999)).toBe("A");
    expect(rankFromScore(850_000)).toBe("A");
    expect(rankFromScore(849_999)).toBe("B");
    expect(rankFromScore(700_000)).toBe("B");
    expect(rankFromScore(699_999)).toBe("C");
  });
});
