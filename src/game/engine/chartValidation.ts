import type { ChartV1, Difficulty, HoldNote, Note, SongDefinition, ValidationResult } from "./types";

const SUPPORTED_VERSION = 1;
const LANES = new Set([0, 1, 2, 3]);
const DIFFICULTIES: Difficulty[] = ["easy", "normal", "hard"];

export function validateChart(
  chart: ChartV1,
  songs: SongDefinition[],
  options: { songDurationSlackMs?: number } = {},
): ValidationResult {
  const errors: string[] = [];
  const song = songs.find((item) => item.id === chart.songId);
  const slackMs = options.songDurationSlackMs ?? 2_000;

  if (chart.version !== SUPPORTED_VERSION) {
    errors.push("未対応の譜面バージョンです。");
  }

  if (!song) {
    errors.push("譜面のsongIdに対応する曲が見つかりません。");
  }

  if (!DIFFICULTIES.includes(chart.difficulty)) {
    errors.push("譜面の難易度が不正です。");
  }

  if (!Number.isFinite(chart.level) || chart.level <= 0) {
    errors.push("譜面レベルが不正です。");
  }

  if (!Number.isFinite(chart.offsetMs)) {
    errors.push("譜面offsetMsが不正です。");
  }

  if (!Number.isFinite(chart.approachTimeMs) || chart.approachTimeMs <= 0) {
    errors.push("譜面approachTimeMsが不正です。");
  }

  const seenIds = new Set<string>();
  let previousTimeMs = -Infinity;
  const laneHoldEnds = [0, 0, 0, 0];

  chart.notes.forEach((note, index) => {
    if (!note.id) {
      errors.push(`${index + 1}番目のノーツIDが空です。`);
    }

    if (seenIds.has(note.id)) {
      errors.push(`ノーツIDが重複しています: ${note.id}`);
    }
    seenIds.add(note.id);

    if (!LANES.has(note.lane)) {
      errors.push(`${note.id}のlaneが0〜3の範囲外です。`);
    }

    if (!Number.isFinite(note.timeMs) || note.timeMs < 0) {
      errors.push(`${note.id}のtimeMsが不正です。`);
    }

    if (note.timeMs < previousTimeMs) {
      errors.push("ノーツが時刻順に並んでいません。");
    }
    previousTimeMs = note.timeMs;

    if (note.type === "hold") {
      validateHoldNote(note, errors);
    }

    if (LANES.has(note.lane) && note.timeMs < laneHoldEnds[note.lane]) {
      errors.push(`${note.id}が同一レーンのホールドと重なっています。`);
    }

    if (note.type === "hold" && LANES.has(note.lane)) {
      laneHoldEnds[note.lane] = Math.max(laneHoldEnds[note.lane], note.timeMs + note.durationMs);
    }

    const noteEndMs = note.type === "hold" ? note.timeMs + note.durationMs : note.timeMs;
    if (song && noteEndMs > song.durationMs + slackMs) {
      errors.push(`${note.id}が曲の長さを大幅に超えています。`);
    }
  });

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

function validateHoldNote(note: HoldNote, errors: string[]) {
  if (!Number.isFinite(note.durationMs) || note.durationMs <= 0) {
    errors.push(`${note.id}のdurationMsが不正です。`);
  }
}

export function validateSongCharts(
  song: SongDefinition,
  charts: Partial<Record<Difficulty, ChartV1>>,
  songs: SongDefinition[],
): ValidationResult {
  const errors: string[] = [];

  DIFFICULTIES.forEach((difficulty) => {
    const chart = charts[difficulty];
    if (!chart) {
      errors.push(`${song.title}の${difficulty.toUpperCase()}譜面が見つかりません。`);
      return;
    }

    const result = validateChart(chart, songs);
    if (!result.ok) {
      result.errors.forEach((error) => errors.push(`${difficulty.toUpperCase()}: ${error}`));
    }
  });

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors };
}

export function cloneSortedNotes(notes: Note[]): Note[] {
  return [...notes].sort((a, b) => a.timeMs - b.timeMs || a.lane - b.lane);
}
