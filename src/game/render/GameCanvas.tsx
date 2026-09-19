import { forwardRef, useEffect } from "react";
import type { RhythmEngine } from "../engine/RhythmEngine";
import { createCanvasRenderer } from "./canvasRenderer";

type GameCanvasProps = {
  engine: RhythmEngine;
};

export const GameCanvas = forwardRef<HTMLCanvasElement, GameCanvasProps>(function GameCanvas(
  { engine },
  ref,
) {
  useEffect(() => {
    const canvas = typeof ref === "function" ? null : ref?.current;
    if (!canvas) return undefined;

    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const renderer = createCanvasRenderer(canvas, { reducedMotion });
    let frameId = 0;
    let active = true;

    const tick = () => {
      if (!active) return;
      engine.update();
      renderer.render(engine.getRenderState());
      frameId = window.requestAnimationFrame(tick);
    };

    frameId = window.requestAnimationFrame(tick);

    return () => {
      active = false;
      window.cancelAnimationFrame(frameId);
      renderer.dispose();
    };
  }, [engine, ref]);

  return <canvas ref={ref} className="game-canvas" aria-label="NEO KAWAII BEAT プレイフィールド" />;
});
