import type { Judgment } from "./types";

export type JudgeWindows = {
  perfectMs: number;
  greatMs: number;
  goodMs: number;
};

export const DEFAULT_JUDGE_WINDOWS: JudgeWindows = {
  perfectMs: 45,
  greatMs: 90,
  goodMs: 140,
};

export function calculateDeltaMs(
  inputSongPositionMs: number,
  noteTimeMs: number,
  judgmentOffsetMs: number,
): number {
  return inputSongPositionMs + judgmentOffsetMs - noteTimeMs;
}

export function judgeDelta(deltaMs: number, windows: JudgeWindows = DEFAULT_JUDGE_WINDOWS): Judgment {
  const absDelta = Math.abs(deltaMs);
  if (absDelta <= windows.perfectMs) return "perfect";
  if (absDelta <= windows.greatMs) return "great";
  if (absDelta <= windows.goodMs) return "good";
  return "miss";
}

export function isHitJudgment(judgment: Judgment): boolean {
  return judgment !== "miss";
}

export function isPastMissWindow(deltaMs: number, windows: JudgeWindows = DEFAULT_JUDGE_WINDOWS): boolean {
  return deltaMs > windows.goodMs;
}
