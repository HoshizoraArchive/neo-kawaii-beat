# Architecture

NEO KAWAII BEATのMVPは、Reactを画面遷移とDOM UI、Canvas 2Dをプレイフィールド、Web Audio APIを音声時計として分離しています。

## Reactとゲームエンジン

Reactはタイトル、曲選択、READY、設定、リザルト、中断画面を担当します。プレイ中のノーツ座標、判定、コンボ、スコア更新は `RhythmEngine` が所有し、毎フレームReact stateへ流しません。

`PlayScreen` はAudioPlayer、RhythmEngine、inputController、GameCanvasを接続する薄い境界です。React StrictModeでマウントが繰り返されても、cleanupでAudioBufferSourceNode、入力リスナー、requestAnimationFrameを破棄します。

## AudioClock

判定基準は `AudioClock` の曲位置です。`setTimeout`、`setInterval`、フレーム数、ノーツ座標、HTMLAudioElementの `currentTime` は判定に使いません。

AudioContextはSTART時に `new AudioContext({ latencyHint: "interactive" })` で作成またはresumeし、曲は `audioContext.currentTime + 1.2` 秒へ予約します。`AudioClock` は可能なら `getOutputTimestamp()` を使い、フォールバックでは `currentTime - outputLatency` を使います。

譜面の `offsetMs` は曲ごとの音源ずれ、ユーザー設定の `judgmentOffsetMs` は端末やイヤホン差の調整に使います。正の判定オフセットは早押し傾向の補正、負の判定オフセットは遅押し傾向の補正です。

## Canvas描画

Canvasは `devicePixelRatio` に対応しつつ、描画DPRを最大2に制限します。レーン、ノーツ、判定ライン、判定文字、星座、成功時の光は `canvasRenderer` が描画します。レーンレイアウトは入力処理と同じ関数を共有します。

## 中断処理

プレイ中に `visibilitychange`、`pagehide`、AudioContextの `suspended` が発生した場合、そのランは保存せず中断画面へ移動します。不正確な途中再開より、安全な停止を優先します。

## ローカル保存

`localStorage` のキーは `neo-kawaii-beat.v1.settings` と `neo-kawaii-beat.v1.records` です。壊れたJSONや未知バージョンはデフォルト値へ復旧します。

## 将来の星空Village連携

楽曲定義には `source.kind: "official" | "village"`、`sourcePostUrl`、`authorProfileUrl`、`selectionReason`、`archiveEventId` を任意項目として用意しています。今回のMVPではSupabaseテーブル、仮API、Archive集計は作っていません。
