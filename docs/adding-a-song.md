# Adding a Song

実曲を追加する場合は、自分または星空Villageが利用権を持つ楽曲だけを使ってください。第三者の音源、フリー素材サイトの音源、外部URLを許可なく追加しないでください。

## 1. 音源を配置する

MP3、Ogg、WAVなどのブラウザで再生できる音源を `public/audio/` に置きます。

例：

```text
public/audio/hoshikun-song.mp3
```

## 2. 楽曲カタログへ追加する

`src/game/content/songCatalog.ts` に曲定義を追加します。

```ts
{
  id: "hoshikun-song",
  title: "曲名",
  artist: "アーティスト名",
  bpm: 128,
  durationMs: 123000,
  audio: { kind: "url", src: "/audio/hoshikun-song.mp3" },
  source: {
    kind: "village",
    sourcePostUrl: "https://example.com/post",
    selectionReason: "archive_event"
  },
  jacketKind: "url",
  jacketUrl: "/jackets/hoshikun-song.png"
}
```

`sourcePostUrl` がある曲だけ、曲選択やリザルトで「作品を見る」導線を表示できます。

## 3. ジャケットを配置する

ジャケット画像は `public/jackets/` に置きます。画像がない場合は、MVPの生成ジャケット表示を使えます。

## 4. 譜面を追加する

`src/game/content/charts/` に `easy`、`normal`、`hard` の3譜面を追加します。全難易度が揃わない曲は開始できません。

## 5. BPMと曲長を確認する

`bpm` と `durationMs` は曲選択、譜面検証、進行表示に使います。曲長より大幅に後ろのノーツは検証エラーになります。

## 6. offsetMsを調整する

音源の発音タイミングと譜面がずれる場合は、譜面ごとの `offsetMs` を調整します。端末やBluetoothイヤホンの遅延は設定画面の判定オフセットで調整します。

## 7. ローカル確認

```sh
npm run lint
npm run test
npm run build
npm run dev
```

スマホ幅、PCキー、ホールド、同時押し、タブ切替中断、音声OFFを確認してください。
