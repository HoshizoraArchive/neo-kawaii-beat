import type { Difficulty, ScoreResult } from "../engine/types";

export type StorageLike = {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
};

export type GameSettings = {
  version: 1;
  judgmentOffsetMs: number;
  soundEnabled: boolean;
};

export type LocalRecordEntry = {
  score: number;
  accuracy: number;
  maxCombo: number;
  fullCombo: boolean;
  allPerfect: boolean;
  playedAt: string;
};

export type LocalRecords = {
  version: 1;
  records: Record<string, Partial<Record<Difficulty, LocalRecordEntry>>>;
};

export const SETTINGS_KEY = "neo-kawaii-beat.v1.settings";
export const RECORDS_KEY = "neo-kawaii-beat.v1.records";

export const DEFAULT_SETTINGS: GameSettings = {
  version: 1,
  judgmentOffsetMs: 0,
  soundEnabled: true,
};

export const DEFAULT_RECORDS: LocalRecords = {
  version: 1,
  records: {},
};

export function getBrowserStorage(): StorageLike | undefined {
  if (typeof window === "undefined") return undefined;
  return window.localStorage;
}

export function loadSettings(storage: StorageLike | undefined = getBrowserStorage()): GameSettings {
  const parsed = readJson(storage, SETTINGS_KEY);
  if (!isRecord(parsed) || parsed.version !== 1) {
    return { ...DEFAULT_SETTINGS };
  }

  return {
    version: 1,
    judgmentOffsetMs: clampOffset(parsed.judgmentOffsetMs),
    soundEnabled: typeof parsed.soundEnabled === "boolean" ? parsed.soundEnabled : true,
  };
}

export function saveSettings(settings: GameSettings, storage: StorageLike | undefined = getBrowserStorage()) {
  storage?.setItem(SETTINGS_KEY, JSON.stringify(settings));
}

export function loadRecords(storage: StorageLike | undefined = getBrowserStorage()): LocalRecords {
  const parsed = readJson(storage, RECORDS_KEY);
  if (!isRecord(parsed) || parsed.version !== 1 || !isRecord(parsed.records)) {
    return { version: 1, records: {} };
  }

  const records: LocalRecords["records"] = {};
  Object.entries(parsed.records).forEach(([songId, difficulties]) => {
    if (!isRecord(difficulties)) return;
    records[songId] = {};
    (["easy", "normal", "hard"] as Difficulty[]).forEach((difficulty) => {
      const entry = difficulties[difficulty];
      if (isRecordEntry(entry)) {
        records[songId][difficulty] = entry;
      }
    });
  });

  return { version: 1, records };
}

export function saveRecords(records: LocalRecords, storage: StorageLike | undefined = getBrowserStorage()) {
  storage?.setItem(RECORDS_KEY, JSON.stringify(records));
}

export function upsertLocalRecord(input: {
  records: LocalRecords;
  songId: string;
  difficulty: Difficulty;
  result: ScoreResult;
  now?: Date;
}): { records: LocalRecords; newBest: boolean; best: LocalRecordEntry } {
  const current = input.records.records[input.songId]?.[input.difficulty];
  const entry: LocalRecordEntry = {
    score: input.result.score,
    accuracy: input.result.accuracy,
    maxCombo: input.result.maxCombo,
    fullCombo: input.result.fullCombo,
    allPerfect: input.result.allPerfect,
    playedAt: (input.now ?? new Date()).toISOString(),
  };

  const newBest =
    !current ||
    entry.score > current.score ||
    (entry.score === current.score && entry.accuracy > current.accuracy);

  if (!newBest) {
    return { records: input.records, newBest: false, best: current };
  }

  const next: LocalRecords = {
    version: 1,
    records: {
      ...input.records.records,
      [input.songId]: {
        ...input.records.records[input.songId],
        [input.difficulty]: entry,
      },
    },
  };

  return { records: next, newBest: true, best: entry };
}

function readJson(storage: StorageLike | undefined, key: string): unknown {
  if (!storage) return undefined;
  try {
    const raw = storage.getItem(key);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isRecordEntry(value: unknown): value is LocalRecordEntry {
  if (!isRecord(value)) return false;
  return (
    typeof value.score === "number" &&
    typeof value.accuracy === "number" &&
    typeof value.maxCombo === "number" &&
    typeof value.fullCombo === "boolean" &&
    typeof value.allPerfect === "boolean" &&
    typeof value.playedAt === "string"
  );
}

function clampOffset(value: unknown): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 0;
  return Math.max(-200, Math.min(200, Math.round(value / 5) * 5));
}
