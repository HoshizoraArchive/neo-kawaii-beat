import type { ChartV1, Difficulty, SongDefinition } from "../engine/types";
import { demoEasy } from "./charts/demoEasy";
import { demoHard } from "./charts/demoHard";
import { demoNormal } from "./charts/demoNormal";

export const songCatalog: SongDefinition[] = [
  {
    id: "stardust-test-beat",
    title: "星屑テストビート",
    artist: "Hoshizora Village Lab",
    bpm: 120,
    durationMs: 24_000,
    audio: { kind: "generated", generator: "demo-v1" },
    source: {
      kind: "official",
      selectionReason: "official",
    },
    jacketKind: "generated-css",
  },
];

export const chartsBySong: Record<string, Record<Difficulty, ChartV1>> = {
  "stardust-test-beat": {
    easy: demoEasy,
    normal: demoNormal,
    hard: demoHard,
  },
};

export function getSong(songId: string): SongDefinition {
  const song = songCatalog.find((item) => item.id === songId);
  if (!song) {
    throw new Error("曲が見つかりません。");
  }
  return song;
}

export function getChart(songId: string, difficulty: Difficulty): ChartV1 {
  const chart = chartsBySong[songId]?.[difficulty];
  if (!chart) {
    throw new Error("譜面が見つかりません。");
  }
  return chart;
}
