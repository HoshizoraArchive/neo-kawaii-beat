import type { EngineRenderState } from "../engine/RhythmEngine";
import type { HoldNote } from "../engine/types";
import { getLaneLayout, type LaneLayout } from "./layout";

type RendererOptions = {
  reducedMotion: boolean;
};

const constellation = [
  { x: 0.22, y: 0.22, gate: 0.15 },
  { x: 0.38, y: 0.16, gate: 0.25 },
  { x: 0.51, y: 0.26, gate: 0.5 },
  { x: 0.65, y: 0.18, gate: 0.75 },
  { x: 0.78, y: 0.31, gate: 1 },
];

export function createCanvasRenderer(canvas: HTMLCanvasElement, options: RendererOptions) {
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    throw new Error("Canvas 2Dを初期化できませんでした。");
  }

  let cssWidth = 0;
  let cssHeight = 0;
  let dpr = 1;

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    const nextDpr = Math.min(2, window.devicePixelRatio || 1);
    if (rect.width === cssWidth && rect.height === cssHeight && nextDpr === dpr) return;
    cssWidth = Math.max(1, Math.floor(rect.width));
    cssHeight = Math.max(1, Math.floor(rect.height));
    dpr = nextDpr;
    canvas.width = Math.floor(cssWidth * dpr);
    canvas.height = Math.floor(cssHeight * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const observer = new ResizeObserver(resize);
  observer.observe(canvas);
  resize();

  return {
    render(state: EngineRenderState) {
      resize();
      drawFrame(ctx, cssWidth, cssHeight, state, options);
    },
    dispose() {
      observer.disconnect();
    },
  };
}

function drawFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: EngineRenderState,
  options: RendererOptions,
) {
  const layout = getLaneLayout(width, height);
  ctx.clearRect(0, 0, width, height);
  drawBackground(ctx, width, height, state, options);
  drawHud(ctx, width, state);
  drawConstellation(ctx, width, height, state.constellationProgress);
  drawLanes(ctx, layout, state);
  drawNotes(ctx, layout, state);
  drawSparks(ctx, layout, width, height, state);
  drawJudgments(ctx, layout, state);
  drawCountdown(ctx, width, height, state);
}

function drawBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  state: EngineRenderState,
  options: RendererOptions,
) {
  const gradient = ctx.createLinearGradient(0, 0, 0, height);
  gradient.addColorStop(0, "#071126");
  gradient.addColorStop(0.52, "#0c1735");
  gradient.addColorStop(1, "#151031");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  ctx.save();
  ctx.globalAlpha = 0.18 + state.constellationProgress * 0.16;
  ctx.fillStyle = "#89e8ff";
  for (let i = 0; i < 64; i += 1) {
    const x = ((i * 73) % 997) / 997 * width;
    const drift = options.reducedMotion ? 0 : Math.sin(state.songPositionMs / 1_800 + i) * 2;
    const y = ((i * 191) % 887) / 887 * height * 0.72 + drift;
    const radius = i % 9 === 0 ? 1.5 : 0.8;
    ctx.globalAlpha = 0.08 + ((i % 5) / 5) * 0.2 + state.constellationProgress * 0.18;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.strokeStyle = "#f5d777";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(width - 52, 62, 26, Math.PI * 0.18, Math.PI * 1.62);
  ctx.stroke();
  ctx.restore();

  ctx.save();
  ctx.globalAlpha = 0.16;
  ctx.strokeStyle = "#ff8edb";
  ctx.lineWidth = 18;
  ctx.beginPath();
  ctx.moveTo(-20, height * 0.28);
  ctx.bezierCurveTo(width * 0.25, height * 0.2, width * 0.6, height * 0.42, width + 40, height * 0.24);
  ctx.stroke();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#7ee7ff";
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(-30, height * 0.38);
  ctx.bezierCurveTo(width * 0.3, height * 0.3, width * 0.68, height * 0.52, width + 30, height * 0.36);
  ctx.stroke();
  ctx.restore();
}

function drawHud(ctx: CanvasRenderingContext2D, width: number, state: EngineRenderState) {
  ctx.save();
  ctx.fillStyle = "rgba(220, 244, 255, 0.9)";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillText(`SCORE ${state.score.toLocaleString("ja-JP")}`, 18, 74);
  ctx.textAlign = "right";
  ctx.fillText(`${Math.round(state.progress * 100)}%`, width - 18, 74);
  ctx.restore();
}

function drawConstellation(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  progress: number,
) {
  const points = constellation.map((point) => ({
    x: point.x * width,
    y: point.y * height,
    lit: progress >= point.gate,
  }));

  ctx.save();
  ctx.lineWidth = 1.5;
  for (let i = 0; i < points.length - 1; i += 1) {
    const from = points[i];
    const to = points[i + 1];
    ctx.strokeStyle = progress >= constellation[i + 1].gate ? "rgba(137, 232, 255, 0.68)" : "rgba(137, 232, 255, 0.12)";
    ctx.beginPath();
    ctx.moveTo(from.x, from.y);
    ctx.lineTo(to.x, to.y);
    ctx.stroke();
  }

  points.forEach((point) => {
    ctx.fillStyle = point.lit ? "rgba(255, 239, 172, 0.95)" : "rgba(180, 207, 255, 0.22)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, point.lit ? 3.4 : 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawLanes(ctx: CanvasRenderingContext2D, layout: LaneLayout, state: EngineRenderState) {
  ctx.save();
  ctx.fillStyle = "rgba(10, 22, 47, 0.52)";
  roundRect(ctx, layout.x, layout.y, layout.width, layout.height + 64, 16);
  ctx.fill();

  for (let lane = 0; lane < 4; lane += 1) {
    const x = layout.x + lane * layout.laneWidth;
    ctx.fillStyle = state.lanePressed[lane] ? "rgba(137, 232, 255, 0.14)" : "rgba(255, 255, 255, 0.03)";
    ctx.fillRect(x, layout.y, layout.laneWidth, layout.height + 64);
    if (lane > 0) {
      ctx.strokeStyle = "rgba(188, 226, 255, 0.12)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, layout.y + 8);
      ctx.lineTo(x, layout.y + layout.height + 54);
      ctx.stroke();
    }
  }

  ctx.strokeStyle = "rgba(255, 238, 164, 0.82)";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(layout.x + 12, layout.judgeY);
  ctx.lineTo(layout.x + layout.width - 12, layout.judgeY);
  ctx.stroke();

  ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
  ctx.font = "700 12px system-ui, sans-serif";
  ctx.textAlign = "center";
  ["D", "F", "J", "K"].forEach((key, index) => {
    ctx.fillText(key, layout.x + layout.laneWidth * (index + 0.5), layout.judgeY + 34);
  });
  ctx.restore();
}

function drawNotes(ctx: CanvasRenderingContext2D, layout: LaneLayout, state: EngineRenderState) {
  const approach = Math.max(800, state.approachTimeMs);
  state.notes.forEach((renderNote) => {
    const note = renderNote.note;
    const noteY = noteToY(layout, state.songPositionMs, note.timeMs, approach);
    const laneX = layout.x + note.lane * layout.laneWidth;
    const centerX = laneX + layout.laneWidth / 2;

    if (note.type === "hold") {
      drawHold(ctx, layout, state.songPositionMs, note, renderNote.startJudged, centerX, noteY, approach);
    } else {
      drawTap(ctx, centerX, noteY, layout.laneWidth, false);
    }
  });
}

function drawTap(ctx: CanvasRenderingContext2D, centerX: number, centerY: number, laneWidth: number, dim: boolean) {
  ctx.save();
  ctx.translate(centerX, centerY);
  ctx.globalAlpha = dim ? 0.45 : 0.95;
  const radius = Math.max(18, laneWidth * 0.28);
  const gradient = ctx.createLinearGradient(-radius, -radius, radius, radius);
  gradient.addColorStop(0, "#89e8ff");
  gradient.addColorStop(0.52, "#ffd6f2");
  gradient.addColorStop(1, "#fff0a6");
  ctx.fillStyle = gradient;
  ctx.beginPath();
  ctx.moveTo(0, -radius * 0.62);
  ctx.lineTo(radius * 0.74, 0);
  ctx.lineTo(0, radius * 0.62);
  ctx.lineTo(-radius * 0.74, 0);
  ctx.closePath();
  ctx.fill();
  ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.restore();
}

function drawHold(
  ctx: CanvasRenderingContext2D,
  layout: LaneLayout,
  songPositionMs: number,
  note: HoldNote,
  startJudged: boolean,
  centerX: number,
  startY: number,
  approach: number,
) {
  const endY = noteToY(layout, songPositionMs, note.timeMs + note.durationMs, approach);
  const top = Math.min(startY, endY);
  const height = Math.abs(endY - startY);
  const width = Math.max(18, layout.laneWidth * 0.26);

  ctx.save();
  ctx.globalAlpha = startJudged ? 0.72 : 0.92;
  const gradient = ctx.createLinearGradient(centerX, top, centerX, top + height);
  gradient.addColorStop(0, "rgba(137, 232, 255, 0.16)");
  gradient.addColorStop(0.55, "rgba(255, 142, 219, 0.5)");
  gradient.addColorStop(1, "rgba(255, 240, 166, 0.86)");
  ctx.fillStyle = gradient;
  roundRect(ctx, centerX - width / 2, top, width, height + 4, width / 2);
  ctx.fill();
  drawTap(ctx, centerX, startY, layout.laneWidth, startJudged);
  drawTap(ctx, centerX, endY, layout.laneWidth, false);
  ctx.restore();
}

function drawSparks(
  ctx: CanvasRenderingContext2D,
  layout: LaneLayout,
  width: number,
  height: number,
  state: EngineRenderState,
) {
  ctx.save();
  state.sparks.forEach((spark, index) => {
    const age = Math.max(0, Math.min(1, (state.songPositionMs - spark.createdAtMs) / 900));
    const laneX = layout.x + layout.laneWidth * (spark.lane + 0.5);
    const target = constellation[index % constellation.length];
    const x = lerp(laneX, target.x * width, easeOut(age));
    const y = lerp(layout.judgeY, target.y * height, easeOut(age));
    ctx.globalAlpha = (1 - age) * spark.strength;
    ctx.fillStyle = "#fff0a6";
    ctx.beginPath();
    ctx.arc(x, y, 2 + spark.strength * 2, 0, Math.PI * 2);
    ctx.fill();
  });
  ctx.restore();
}

function drawJudgments(ctx: CanvasRenderingContext2D, layout: LaneLayout, state: EngineRenderState) {
  ctx.save();
  ctx.textAlign = "center";
  const latest = state.floatingJudges[state.floatingJudges.length - 1];
  if (latest) {
    const age = Math.max(0, Math.min(1, (state.songPositionMs - latest.createdAtMs) / 720));
    ctx.globalAlpha = 1 - age;
    ctx.fillStyle = latest.text === "MISS" ? "#bccfff" : "#fff0a6";
    ctx.font = "800 26px system-ui, sans-serif";
    ctx.fillText(latest.text, layout.x + layout.width / 2, layout.judgeY - 96 - age * 18);
  }

  if (state.combo > 0) {
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = "#dff8ff";
    ctx.font = "700 18px system-ui, sans-serif";
    ctx.fillText(`${state.combo} COMBO`, layout.x + layout.width / 2, layout.judgeY - 66);
  }
  ctx.restore();
}

function drawCountdown(ctx: CanvasRenderingContext2D, width: number, height: number, state: EngineRenderState) {
  if (state.countdownSeconds <= 0) return;
  ctx.save();
  ctx.fillStyle = "rgba(6, 12, 29, 0.42)";
  ctx.fillRect(0, 0, width, height);
  ctx.textAlign = "center";
  ctx.fillStyle = "#fff0a6";
  ctx.font = "800 52px system-ui, sans-serif";
  ctx.fillText(Math.ceil(state.countdownSeconds).toString(), width / 2, height / 2);
  ctx.fillStyle = "rgba(223, 248, 255, 0.86)";
  ctx.font = "600 14px system-ui, sans-serif";
  ctx.fillText("音を待っています", width / 2, height / 2 + 34);
  ctx.restore();
}

function noteToY(layout: LaneLayout, songPositionMs: number, noteTimeMs: number, approachMs: number): number {
  return layout.judgeY - ((noteTimeMs - songPositionMs) / approachMs) * layout.height;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number,
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + width, y, x + width, y + height, radius);
  ctx.arcTo(x + width, y + height, x, y + height, radius);
  ctx.arcTo(x, y + height, x, y, radius);
  ctx.arcTo(x, y, x + width, y, radius);
  ctx.closePath();
}

function lerp(from: number, to: number, amount: number): number {
  return from + (to - from) * amount;
}

function easeOut(value: number): number {
  return 1 - (1 - value) * (1 - value);
}
