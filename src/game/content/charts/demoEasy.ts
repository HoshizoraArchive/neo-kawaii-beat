import type { ChartV1, Lane, Note } from "../../engine/types";

const q = 500;
const tap = (id: string, lane: Lane, beat: number): Note => ({
  id,
  type: "tap",
  lane,
  timeMs: 1_000 + beat * q,
});
const hold = (id: string, lane: Lane, beat: number, durationBeats: number): Note => ({
  id,
  type: "hold",
  lane,
  timeMs: 1_000 + beat * q,
  durationMs: durationBeats * q,
});

export const demoEasy: ChartV1 = {
  version: 1,
  songId: "stardust-test-beat",
  difficulty: "easy",
  level: 1,
  offsetMs: 0,
  approachTimeMs: 1_900,
  notes: [
    // 最初の約6秒は中央2レーンだけ。曲を聴く余裕を先に作る。
    tap("e-001", 1, 2),
    tap("e-002", 2, 4),
    tap("e-003", 1, 6),
    tap("e-004", 2, 8),
    tap("e-005", 1, 10),

    // 中盤から外側も一つずつ触らせる。連打・同時押しは入れない。
    tap("e-006", 2, 14),
    tap("e-007", 0, 18),
    tap("e-008", 1, 22),
    tap("e-009", 3, 26),
    hold("e-010", 2, 30, 2),

    // 終盤だけ少し密度を上げるが、最後まで四分音符より速くしない。
    tap("e-011", 1, 34),
    tap("e-012", 3, 36),
    tap("e-013", 2, 38),
    tap("e-014", 0, 40),
    tap("e-015", 1, 42),
    tap("e-016", 2, 44),
  ],
};
