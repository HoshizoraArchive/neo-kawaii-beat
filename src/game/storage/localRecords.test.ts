import { describe, expect, it } from "vitest";
import {
  DEFAULT_RECORDS,
  DEFAULT_SETTINGS,
  loadRecords,
  loadSettings,
  RECORDS_KEY,
  saveRecords,
  saveSettings,
  SETTINGS_KEY,
  upsertLocalRecord,
  type StorageLike,
} from "./localRecords";
import { buildScoreResult, createJudgmentCounts } from "../engine/scoring";

class MemoryStorage implements StorageLike {
  private readonly values = new Map<string, string>();

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    this.values.set(key, value);
  }
}

describe("localRecords", () => {
  it("saves and loads settings", () => {
    const storage = new MemoryStorage();
    saveSettings({ version: 1, judgmentOffsetMs: 35, soundEnabled: false }, storage);
    expect(loadSettings(storage)).toEqual({ version: 1, judgmentOffsetMs: 35, soundEnabled: false });
  });

  it("recovers from broken JSON", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, "{broken");
    storage.setItem(RECORDS_KEY, "{broken");
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    expect(loadRecords(storage)).toEqual(DEFAULT_RECORDS);
  });

  it("recovers from unknown versions", () => {
    const storage = new MemoryStorage();
    storage.setItem(SETTINGS_KEY, JSON.stringify({ version: 99, judgmentOffsetMs: 20, soundEnabled: false }));
    storage.setItem(RECORDS_KEY, JSON.stringify({ version: 99, records: { song: {} } }));
    expect(loadSettings(storage)).toEqual(DEFAULT_SETTINGS);
    expect(loadRecords(storage)).toEqual(DEFAULT_RECORDS);
  });

  it("saves a new best record", () => {
    const counts = createJudgmentCounts();
    counts.perfect = 2;
    const result = buildScoreResult({
      counts,
      maxJudgmentCount: 2,
      combo: 2,
      maxCombo: 2,
      trend: { early: 0, late: 0, averageDeltaMs: 0 },
    });

    const updated = upsertLocalRecord({
      records: DEFAULT_RECORDS,
      songId: "song",
      difficulty: "easy",
      result,
      now: new Date("2026-07-04T00:00:00.000Z"),
    });

    const storage = new MemoryStorage();
    saveRecords(updated.records, storage);
    expect(loadRecords(storage).records.song.easy?.score).toBe(1_000_000);
    expect(updated.newBest).toBe(true);
  });
});
