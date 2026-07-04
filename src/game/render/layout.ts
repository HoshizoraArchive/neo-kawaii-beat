export type LaneLayout = {
  x: number;
  y: number;
  width: number;
  height: number;
  laneWidth: number;
  judgeY: number;
};

export function getLaneLayout(width: number, height: number): LaneLayout {
  const safeWidth = Math.max(280, width);
  const playWidth = Math.min(safeWidth - 24, 480);
  const playHeight = Math.max(420, height);
  const x = (safeWidth - playWidth) / 2;
  const y = Math.max(92, playHeight * 0.1);
  const bottomPadding = Math.max(92, playHeight * 0.14);
  return {
    x,
    y,
    width: playWidth,
    height: playHeight - y - bottomPadding,
    laneWidth: playWidth / 4,
    judgeY: playHeight - bottomPadding,
  };
}
