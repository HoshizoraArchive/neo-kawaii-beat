import type { Lane } from "../engine/types";
import { getLaneLayout } from "../render/layout";

type InputCallbacks = {
  laneDown(lane: Lane): void;
  laneUp(lane: Lane): void;
  cancelAll(): void;
};

type InputControllerOptions = {
  target: HTMLElement;
  callbacks: InputCallbacks;
};

const KEY_TO_LANE: Record<string, Lane> = {
  KeyD: 0,
  ArrowLeft: 0,
  KeyF: 1,
  ArrowDown: 1,
  KeyJ: 2,
  ArrowUp: 2,
  KeyK: 3,
  ArrowRight: 3,
};

export function createInputController(options: InputControllerOptions) {
  const pointerLanes = new Map<number, Lane>();
  const pressedKeys = new Set<string>();

  const resolveLane = (clientX: number): Lane => {
    const rect = options.target.getBoundingClientRect();
    const layout = getLaneLayout(rect.width, rect.height);
    const localX = clientX - rect.left;
    const ratio = Math.max(0, Math.min(0.999, (localX - layout.x) / layout.width));
    return Math.floor(ratio * 4) as Lane;
  };

  const onPointerDown = (event: PointerEvent) => {
    if (!event.isPrimary && event.pointerType === "mouse") return;
    event.preventDefault();
    const lane = resolveLane(event.clientX);
    pointerLanes.set(event.pointerId, lane);
    options.target.setPointerCapture?.(event.pointerId);
    options.callbacks.laneDown(lane);
  };

  const onPointerUp = (event: PointerEvent) => {
    event.preventDefault();
    const lane = pointerLanes.get(event.pointerId);
    if (lane !== undefined) {
      options.callbacks.laneUp(lane);
      pointerLanes.delete(event.pointerId);
    }
  };

  const onPointerCancel = (event: PointerEvent) => {
    event.preventDefault();
    if (!pointerLanes.has(event.pointerId)) return;
    pointerLanes.delete(event.pointerId);
    options.callbacks.cancelAll();
  };

  const onKeyDown = (event: KeyboardEvent) => {
    const lane = KEY_TO_LANE[event.code];
    if (lane === undefined || event.repeat || pressedKeys.has(event.code)) return;
    event.preventDefault();
    pressedKeys.add(event.code);
    options.callbacks.laneDown(lane);
  };

  const onKeyUp = (event: KeyboardEvent) => {
    const lane = KEY_TO_LANE[event.code];
    if (lane === undefined) return;
    event.preventDefault();
    pressedKeys.delete(event.code);
    options.callbacks.laneUp(lane);
  };

  options.target.addEventListener("pointerdown", onPointerDown, { passive: false });
  options.target.addEventListener("pointerup", onPointerUp, { passive: false });
  options.target.addEventListener("pointercancel", onPointerCancel, { passive: false });
  window.addEventListener("keydown", onKeyDown, { passive: false });
  window.addEventListener("keyup", onKeyUp, { passive: false });

  return {
    dispose() {
      options.target.removeEventListener("pointerdown", onPointerDown);
      options.target.removeEventListener("pointerup", onPointerUp);
      options.target.removeEventListener("pointercancel", onPointerCancel);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      pointerLanes.clear();
      pressedKeys.clear();
      options.callbacks.cancelAll();
    },
  };
}
