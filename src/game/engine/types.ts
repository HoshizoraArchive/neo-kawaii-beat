export type Difficulty = "easy" | "normal" | "hard";
export type Lane = 0 | 1 | 2 | 3;

export type TapNote = {
  id: string;
  type: "tap";
  lane: Lane;
  timeMs: number;
};

export type HoldNote = {
  id: string;
  type: "hold";
  lane: Lane;
  timeMs: number;
  durationMs: number;
};

export type Note = TapNote | HoldNote;

export type ChartV1 = {
  version: 1;
  songId: string;
  difficulty: Difficulty;
  level: number;
  offsetMs: number;
  approachTimeMs: number;
  notes: Note[];
};

export type SongAudioSource =
  | { kind: "generated"; generator: "demo-v1" }
  | { kind: "url"; src: string };

export type SongSource = {
  kind: "official" | "village";
  sourcePostUrl?: string;
  authorProfileUrl?: string;
  selectionReason?: "official" | "archive_event" | "special_event";
  archiveEventId?: string;
};

export type SongDefinition = {
  id: string;
  title: string;
  artist: string;
  bpm: number;
  durationMs: number;
  audio: SongAudioSource;
  source: SongSource;
  jacketKind: "generated-css" | "url";
  jacketUrl?: string;
};

export type Judgment = "perfect" | "great" | "good" | "miss";

export type JudgmentCounts = Record<Judgment, number>;

export type TimingTrend = {
  early: number;
  late: number;
  averageDeltaMs: number;
};

export type ScoreResult = {
  score: number;
  accuracy: number;
  rank: "S" | "A" | "B" | "C";
  counts: JudgmentCounts;
  combo: number;
  maxCombo: number;
  maxJudgmentCount: number;
  fullCombo: boolean;
  allPerfect: boolean;
  trend: TimingTrend;
};

export type ValidationResult =
  | { ok: true; errors: [] }
  | { ok: false; errors: string[] };
