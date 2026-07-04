import type { AudioClock } from "../audio/AudioClock";
import { calculateDeltaMs, DEFAULT_JUDGE_WINDOWS, isHitJudgment, isPastMissWindow, judgeDelta } from "./judge";
import { buildScoreResult, createJudgmentCounts, getMaxJudgmentCount } from "./scoring";
import type { ChartV1, Judgment, Lane, Note, ScoreResult } from "./types";

type NoteState = {
  note: Note;
  startJudgment?: Judgment;
  endJudgment?: Judgment;
  holdActive: boolean;
  earlyEndMiss: boolean;
};

export type FloatingJudge = {
  text: string;
  lane: Lane;
  createdAtMs: number;
  deltaMs: number;
};

export type Spark = {
  lane: Lane;
  createdAtMs: number;
  strength: number;
};

export type RenderNote = {
  note: Note;
  startJudged: boolean;
  endJudged: boolean;
  holdActive: boolean;
};

export type EngineRenderState = {
  songPositionMs: number;
  progress: number;
  score: number;
  combo: number;
  maxCombo: number;
  counts: ReturnType<typeof createJudgmentCounts>;
  constellationProgress: number;
  approachTimeMs: number;
  notes: RenderNote[];
  lanePressed: boolean[];
  floatingJudges: FloatingJudge[];
  sparks: Spark[];
  countdownSeconds: number;
  finished: boolean;
};

export class RhythmEngine {
  private readonly states: NoteState[];
  private readonly maxJudgmentCount: number;
  private readonly counts = createJudgmentCounts();
  private readonly lanePressCount = [0, 0, 0, 0];
  private readonly floatingJudges: FloatingJudge[] = [];
  private readonly sparks: Spark[] = [];
  private combo = 0;
  private maxCombo = 0;
  private early = 0;
  private late = 0;
  private deltaTotal = 0;
  private deltaCount = 0;
  private completionSent = false;
  private disposed = false;

  constructor(
    private readonly input: {
      chart: ChartV1;
      clock: AudioClock;
      songDurationMs: number;
      judgmentOffsetMs: number;
      onComplete: (result: ScoreResult) => void;
    },
  ) {
    this.states = input.chart.notes.map((note) => ({
      note,
      holdActive: false,
      earlyEndMiss: false,
    }));
    this.maxJudgmentCount = getMaxJudgmentCount(input.chart.notes);
  }

  update() {
    if (this.disposed || this.completionSent) return;

    const songPositionMs = this.getJudgedSongPositionMs();
    this.autoMissPassedNotes(songPositionMs);
    this.resolveHeldEnds(songPositionMs);
    this.trimVisualEvents(songPositionMs);

    if (songPositionMs >= this.input.songDurationMs + 700 && this.areAllJudgmentsResolved()) {
      this.completionSent = true;
      this.input.onComplete(this.getResult());
    }
  }

  laneDown(lane: Lane) {
    if (this.disposed || this.completionSent) return;

    this.lanePressCount[lane] += 1;
    const songPositionMs = this.getRawSongPositionMs();
    const judgedSongPositionMs = songPositionMs + this.input.judgmentOffsetMs;
    const candidate = this.findClosestStartCandidate(lane, judgedSongPositionMs);

    if (!candidate) {
      this.floatingJudges.push({
        text: "LIGHT",
        lane,
        createdAtMs: songPositionMs,
        deltaMs: 0,
      });
      return;
    }

    const deltaMs = judgedSongPositionMs - candidate.note.timeMs;
    const judgment = judgeDelta(deltaMs);
    this.applyJudgment(candidate, "start", judgment, deltaMs);

    if (candidate.note.type === "hold" && isHitJudgment(judgment)) {
      candidate.holdActive = true;
    }
  }

  laneUp(lane: Lane) {
    if (this.disposed || this.completionSent) return;

    this.lanePressCount[lane] = Math.max(0, this.lanePressCount[lane] - 1);
    const songPositionMs = this.getRawSongPositionMs();
    const judgedSongPositionMs = songPositionMs + this.input.judgmentOffsetMs;

    this.states.forEach((state) => {
      if (
        state.note.type !== "hold" ||
        state.note.lane !== lane ||
        !state.holdActive ||
        state.endJudgment
      ) {
        return;
      }

      const endTimeMs = state.note.timeMs + state.note.durationMs;
      const deltaMs = judgedSongPositionMs - endTimeMs;
      if (deltaMs < -DEFAULT_JUDGE_WINDOWS.goodMs) {
        state.earlyEndMiss = true;
        state.holdActive = false;
        this.applyJudgment(state, "end", "miss", deltaMs);
        return;
      }

      if (Math.abs(deltaMs) <= DEFAULT_JUDGE_WINDOWS.goodMs) {
        state.holdActive = false;
        this.applyJudgment(state, "end", judgeDelta(deltaMs), deltaMs);
      }
    });
  }

  cancelAllInputs() {
    this.lanePressCount.fill(0);
    const songPositionMs = this.getRawSongPositionMs();
    const judgedSongPositionMs = songPositionMs + this.input.judgmentOffsetMs;
    this.states.forEach((state) => {
      if (state.note.type !== "hold" || !state.holdActive || state.endJudgment) return;
      const endTimeMs = state.note.timeMs + state.note.durationMs;
      state.holdActive = false;
      this.applyJudgment(state, "end", "miss", judgedSongPositionMs - endTimeMs);
    });
  }

  getRenderState(): EngineRenderState {
    const songPositionMs = this.getRawSongPositionMs();
    const score = buildScoreResult({
      counts: this.counts,
      maxJudgmentCount: this.maxJudgmentCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      trend: this.getTrend(),
    }).score;

    return {
      songPositionMs,
      progress: Math.max(0, Math.min(1, songPositionMs / this.input.songDurationMs)),
      score,
      combo: this.combo,
      maxCombo: this.maxCombo,
      counts: { ...this.counts },
      constellationProgress: this.getConstellationProgress(),
      approachTimeMs: this.input.chart.approachTimeMs,
      notes: this.getVisibleNotes(songPositionMs),
      lanePressed: this.lanePressCount.map((count) => count > 0),
      floatingJudges: [...this.floatingJudges],
      sparks: [...this.sparks],
      countdownSeconds: this.input.clock.getCountdownSeconds(),
      finished: this.completionSent,
    };
  }

  getResult(): ScoreResult {
    return buildScoreResult({
      counts: this.counts,
      maxJudgmentCount: this.maxJudgmentCount,
      combo: this.combo,
      maxCombo: this.maxCombo,
      trend: this.getTrend(),
    });
  }

  dispose() {
    this.disposed = true;
    this.cancelAllInputs();
  }

  private getRawSongPositionMs(): number {
    return this.input.clock.getSongPositionMs();
  }

  private getJudgedSongPositionMs(): number {
    return this.getRawSongPositionMs() + this.input.judgmentOffsetMs;
  }

  private findClosestStartCandidate(lane: Lane, judgedSongPositionMs: number): NoteState | undefined {
    let closest: NoteState | undefined;
    let closestAbs = Number.POSITIVE_INFINITY;

    for (const state of this.states) {
      if (state.note.lane !== lane || state.startJudgment) continue;
      const deltaMs = judgedSongPositionMs - state.note.timeMs;
      if (deltaMs < -DEFAULT_JUDGE_WINDOWS.goodMs) {
        break;
      }
      const absDelta = Math.abs(deltaMs);
      if (absDelta <= DEFAULT_JUDGE_WINDOWS.goodMs && absDelta < closestAbs) {
        closest = state;
        closestAbs = absDelta;
      }
    }

    return closest;
  }

  private autoMissPassedNotes(judgedSongPositionMs: number) {
    this.states.forEach((state) => {
      if (!state.startJudgment) {
        const deltaMs = calculateDeltaMs(
          judgedSongPositionMs - this.input.judgmentOffsetMs,
          state.note.timeMs,
          this.input.judgmentOffsetMs,
        );
        if (isPastMissWindow(deltaMs)) {
          this.applyJudgment(state, "start", "miss", deltaMs);
          if (state.note.type === "hold" && !state.endJudgment) {
            this.applyJudgment(state, "end", "miss", deltaMs);
          }
        }
      }

      if (state.note.type === "hold" && state.startJudgment && !state.endJudgment) {
        const endTimeMs = state.note.timeMs + state.note.durationMs;
        if (!state.holdActive && judgedSongPositionMs > endTimeMs + DEFAULT_JUDGE_WINDOWS.goodMs) {
          this.applyJudgment(state, "end", "miss", judgedSongPositionMs - endTimeMs);
        }
      }
    });
  }

  private resolveHeldEnds(judgedSongPositionMs: number) {
    this.states.forEach((state) => {
      if (
        state.note.type !== "hold" ||
        !state.holdActive ||
        state.endJudgment ||
        this.lanePressCount[state.note.lane] <= 0
      ) {
        return;
      }

      const endTimeMs = state.note.timeMs + state.note.durationMs;
      if (judgedSongPositionMs >= endTimeMs) {
        const deltaMs = judgedSongPositionMs - endTimeMs;
        state.holdActive = false;
        this.applyJudgment(state, "end", judgeDelta(deltaMs), deltaMs);
      }
    });
  }

  private applyJudgment(
    state: NoteState,
    part: "start" | "end",
    judgment: Judgment,
    deltaMs: number,
  ) {
    if (part === "start") {
      if (state.startJudgment) return;
      state.startJudgment = judgment;
    } else {
      if (state.endJudgment) return;
      state.endJudgment = judgment;
    }

    this.counts[judgment] += 1;
    if (judgment === "miss") {
      this.combo = 0;
    } else {
      this.combo += 1;
      this.maxCombo = Math.max(this.maxCombo, this.combo);
      this.sparks.push({
        lane: state.note.lane,
        createdAtMs: this.getRawSongPositionMs(),
        strength: judgment === "perfect" ? 1 : judgment === "great" ? 0.74 : 0.46,
      });
    }

    if (judgment !== "miss") {
      if (deltaMs < 0) this.early += 1;
      if (deltaMs > 0) this.late += 1;
      this.deltaTotal += deltaMs;
      this.deltaCount += 1;
    }

    this.floatingJudges.push({
      text: judgment.toUpperCase(),
      lane: state.note.lane,
      createdAtMs: this.getRawSongPositionMs(),
      deltaMs,
    });
  }

  private getVisibleNotes(songPositionMs: number): RenderNote[] {
    const startMs = songPositionMs - 400;
    const endMs = songPositionMs + this.input.chart.approachTimeMs + 900;
    return this.states
      .filter((state) => {
        const noteEnd = state.note.type === "hold" ? state.note.timeMs + state.note.durationMs : state.note.timeMs;
        if (noteEnd < startMs || state.note.timeMs > endMs) return false;
        if (state.note.type === "tap") return !state.startJudgment;
        return !state.endJudgment || state.holdActive;
      })
      .map((state) => ({
        note: state.note,
        startJudged: Boolean(state.startJudgment),
        endJudged: Boolean(state.endJudgment),
        holdActive: state.holdActive,
      }));
  }

  private trimVisualEvents(songPositionMs: number) {
    while (this.floatingJudges.length > 12) this.floatingJudges.shift();
    while (this.sparks.length > 36) this.sparks.shift();
    for (let i = this.floatingJudges.length - 1; i >= 0; i -= 1) {
      if (songPositionMs - this.floatingJudges[i].createdAtMs > 900) {
        this.floatingJudges.splice(i, 1);
      }
    }
    for (let i = this.sparks.length - 1; i >= 0; i -= 1) {
      if (songPositionMs - this.sparks[i].createdAtMs > 1_200) {
        this.sparks.splice(i, 1);
      }
    }
  }

  private areAllJudgmentsResolved(): boolean {
    return this.states.every((state) => {
      if (!state.startJudgment) return false;
      if (state.note.type === "hold") return Boolean(state.endJudgment);
      return true;
    });
  }

  private getConstellationProgress(): number {
    const successful = this.counts.perfect + this.counts.great + this.counts.good;
    if (this.maxJudgmentCount === 0) return 0;
    return successful / this.maxJudgmentCount;
  }

  private getTrend() {
    return {
      early: this.early,
      late: this.late,
      averageDeltaMs: this.deltaCount > 0 ? this.deltaTotal / this.deltaCount : 0,
    };
  }
}
