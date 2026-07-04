# Manual Test Matrix

この表は手動確認の観点です。未実機の項目を確認済みとは扱いません。

| 環境 | 観点 | 状態 |
| --- | --- | --- |
| iPhone Safari | 起動、タッチ、ホールド、バックグラウンド移行 | 未確認 |
| Android Chrome | 起動、タッチ同時押し、ホールド、画面回転 | 未確認 |
| macOS Chrome | D/F/J/K、矢印キー、ビルド後preview | 未確認 |
| macOS Safari | Web Audio時計、Pointer Events、localStorage | 未確認 |
| Windows Chrome | キーボード入力、音声、リサイズ | 未確認 |
| タッチ同時押し | 複数pointerIdの同時管理 | 未確認 |
| ホールド | 始点成功、早離しMISS、終点判定 | 未確認 |
| Bluetoothイヤホン | 判定オフセット調整 | 未確認 |
| 画面回転 | Canvasリサイズ、safe-area | 未確認 |
| バックグラウンド移行 | ラン中断、BEST非保存 | 未確認 |
| 音声OFF | 無音でもAudioClock進行 | 未確認 |
| localStorage破損 | デフォルト復旧 | 自動テストあり、手動未確認 |
| 低速端末 | DPR制限、パーティクル上限 | 未確認 |
