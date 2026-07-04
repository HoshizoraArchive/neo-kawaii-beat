# Chart Format

MVPの譜面形式は `ChartV1` です。時刻は曲の再生開始を0msとするミリ秒です。

```ts
type Difficulty = "easy" | "normal" | "hard";
type TapNote = {
  id: string;
  type: "tap";
  lane: 0 | 1 | 2 | 3;
  timeMs: number;
};
type HoldNote = {
  id: string;
  type: "hold";
  lane: 0 | 1 | 2 | 3;
  timeMs: number;
  durationMs: number;
};
type ChartV1 = {
  version: 1;
  songId: string;
  difficulty: Difficulty;
  level: number;
  offsetMs: number;
  approachTimeMs: number;
  notes: Array<TapNote | HoldNote>;
};
```

## lane

左から `0, 1, 2, 3` です。PCキーは `D, F, J, K` と矢印キーに対応します。

## tap

`timeMs` に始点判定を持つ通常ノーツです。

## hold

`timeMs` に始点、`timeMs + durationMs` に終点判定を持つ長押しノーツです。始点が成功した場合だけホールド中状態へ入ります。

## offsetMs

曲固有の音源ずれを補正する値です。端末ごとの判定タイミングは設定画面の `judgmentOffsetMs` で調整します。

## approachTimeMs

ノーツが表示されてから判定ラインへ到達するまでの目安です。判定そのものは座標ではなくAudioClockの曲位置で行います。

## バリデーション

以下を検証します。

- versionが対応済みか
- songIdが存在するか
- laneが0〜3か
- timeMsが0以上か
- holdのdurationMsが正数か
- ノーツが時刻順か
- IDが重複していないか
- 同一レーンのホールドが不正に重なっていないか
- 曲の長さを大幅に超えていないか
- EASY / NORMAL / HARDが揃っているか

## サンプルJSON

```json
{
  "version": 1,
  "songId": "stardust-test-beat",
  "difficulty": "easy",
  "level": 2,
  "offsetMs": 0,
  "approachTimeMs": 1700,
  "notes": [
    { "id": "intro-1", "type": "tap", "lane": 0, "timeMs": 1000 },
    { "id": "intro-2", "type": "hold", "lane": 2, "timeMs": 2000, "durationMs": 500 }
  ]
}
```
