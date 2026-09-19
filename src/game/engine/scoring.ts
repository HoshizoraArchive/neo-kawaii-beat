import type { Judgment, JudgmentCounts, Note, ScoreResult, TimingTrend } from "./types";

export const JUDGMENT_WEIGHTS: Record<Judgment, number> = {
  perfect: 1,
  great: 0.75,
  good: 0.4,
  miss: 0,
};

export function createJudgmentCounts(): JudgmentCounts {
  return {
    perfect: 0,
    great: 0,
    good: 0,
    miss: 0,
  };
}

export function getMaxJudgmentCount(notes: Note[]): number {
  return notes.reduce((count, note) => count + (note.type === "hold" ? 2 : 1), 0);
}

export function scoreFromCounts(counts: JudgmentCounts, maxJudgmentCount: number): number {
  if (maxJudgmentCount <= 0) return 0;
  const achievedWeight =
    counts.perfect * JUDGMENT_WEIGHTS.perfect +
    counts.great * JUDGMENT_WEIGHTS.great +
    counts.good * JUDGMENT_WEIGHTS.good;
  return Math.round((achievedWeight / maxJudgmentCount) * 1_000_000);
}

export function accuracyFromCounts(counts: JudgmentCounts, maxJudgmentCount: number): number {
  if (maxJudgmentCount <= 0) return 0;
  const achievedWeight =
    counts.perfect * JUDGMENT_WEIGHTS.perfect +
    counts.great * JUDGMENT_WEIGHTS.great +
    counts.good * JUDGMENT_WEIGHTS.good;
  return (achievedWeight / maxJudgmentCount) * 100;
}

export function rankFromScore(score: number): ScoreResult["rank"] {
  if (score >= 950_000) return "S";
  if (score >= 850_000) return "A";
  if (score >= 700_000) return "B";
  return "C";
}

export function buildScoreResult(input: {
  counts: JudgmentCounts;
  maxJudgmentCount: number;
  combo: number;
  maxCombo: number;
  trend: TimingTrend;
}): ScoreResult {
  const score = scoreFromCounts(input.counts, input.maxJudgmentCount);
  const judgedTotal =
    input.counts.perfect + input.counts.great + input.counts.good + input.counts.miss;
  return {
    score,
    accuracy: accuracyFromCounts(input.counts, input.maxJudgmentCount),
    rank: rankFromScore(score),
    counts: { ...input.counts },
    combo: input.combo,
    maxCombo: input.maxCombo,
    maxJudgmentCount: input.maxJudgmentCount,
    fullCombo: input.counts.miss === 0 && judgedTotal === input.maxJudgmentCount,
    allPerfect: input.counts.perfect === input.maxJudgmentCount && input.maxJudgmentCount > 0,
    trend: input.trend,
  };
}
