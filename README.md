# NEO KAWAII BEAT

残したい音を、遊べる光へ。

NEO KAWAII BEATは、星空Village公式ゲーム群へ追加する単体デプロイ可能なブラウザ音楽ゲームです。MVPでは王道の4レーン落下式リズムゲームとして、最後まで曲を聴いて遊び、成功に応じて夜空と星座へ光が戻る体験を実装しています。

## 現在のMVP

- Vite / React / TypeScript / Canvas 2D / Web Audio API
- EASY / NORMAL / HARDの3譜面
- タップノーツ、ホールドノーツ
- PERFECT / GREAT / GOOD / MISS判定
- スコア、コンボ、最大コンボ、精度、ランク、FULL COMBO、ALL PERFECT
- ローカルBESTと判定タイミング設定の保存
- タブ非表示やバックグラウンド移行時の安全な中断
- 開発用のコード生成デモ曲「星屑テストビート」

## 開発

```sh
npm install
npm run dev
```

開発サーバーは `0.0.0.0` で起動します。スマホ実機で確認する場合は、同じネットワークから端末でアクセスしてください。

## テスト

```sh
npm run lint
npm run test
npm run build
```

判定、スコア、譜面検証、ローカル保存はVitestで検証しています。

## 静的デプロイ

```sh
npm run build
```

`dist/` をNetlifyなどの静的ホスティングへデプロイできます。今回のMVPではNetlify環境変数、Supabase、認証、外部APIは使いません。

## 音源と画像

現在は外部ファイル不要の生成曲のみです。本物の楽曲ファイルを追加する場合は、自分が利用権を持つ音源だけを `public/audio/` に置き、楽曲カタログへ `kind: "url"` の音源として追加します。

ジャケット画像は `public/jackets/`、承認済みの星空ちあ画像は `public/chia/` に置く想定です。現時点では星空ちあ画像を描き直さず、仮カードを表示しています。

## 対応ブラウザ方針

Web Audio API、Canvas 2D、Pointer Events、module scriptに対応する現行ブラウザを対象にします。主な確認対象は iPhone Safari、Android Chrome、macOS Chrome/Safari、Windows Chromeです。

## 今回未実装

ログイン、Supabase、オンラインランキング、楽曲アップロード、ユーザー譜面投稿、Archive集計、月間イベント、星屑の欠片、課金、AI自動譜面生成、本格譜面エディター、フリック/スライドノーツ、MV背景、マルチプレイ、広告、分析SDKは実装していません。
