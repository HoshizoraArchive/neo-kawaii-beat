import type { Difficulty, ScoreResult, SongDefinition } from "../engine/types";
import type { LocalRecordEntry } from "../storage/localRecords";

type ResultScreenProps = {
  song: SongDefinition;
  difficulty: Difficulty;
  result: ScoreResult;
  best: LocalRecordEntry;
  newBest: boolean;
  onRetry: () => void;
  onSongSelect: () => void;
};

export function ResultScreen({
  song,
  difficulty,
  result,
  best,
  newBest,
  onRetry,
  onSongSelect,
}: ResultScreenProps) {
  return (
    <main className="screen result-screen">
      <p className="eyebrow">観測完了</p>
      <h1>{song.title}</h1>
      <p className="muted">{difficulty.toUpperCase()}</p>

      <section className="result-hero glass-panel">
        <div>
          <p className="metric-label">SCORE</p>
          <strong>{result.score.toLocaleString("ja-JP")}</strong>
          {newBest && <span className="new-best">NEW BEST</span>}
        </div>
        <div className="rank-badge">{result.rank}</div>
      </section>

      <section className="result-grid">
        <Metric label="ACCURACY" value={`${result.accuracy.toFixed(2)}%`} />
        <Metric label="MAX COMBO" value={result.maxCombo.toString()} />
        <Metric label="PERFECT 大共鳴" value={result.counts.perfect.toString()} />
        <Metric label="GREAT 共鳴" value={result.counts.great.toString()} />
        <Metric label="GOOD きらめき" value={result.counts.good.toString()} />
        <Metric label="MISS LOST" value={result.counts.miss.toString()} />
      </section>

      <section className="glass-panel">
        <p className="guide-name">星空ちあ｜街の案内人</p>
        <p className="guide-line">{getChiaComment(result)}</p>
        <p className="muted tiny">
          傾向：早押し {result.trend.early} / 遅押し {result.trend.late} / 平均{" "}
          {result.trend.averageDeltaMs.toFixed(1)}ms
        </p>
        <p className="muted tiny">
          LOCAL BEST {best.score.toLocaleString("ja-JP")} / {best.accuracy.toFixed(2)}%
        </p>
      </section>

      <div className="badge-row">
        {result.allPerfect && <span>ALL PERFECT</span>}
        {result.fullCombo && <span>FULL COMBO</span>}
      </div>

      {song.source.sourcePostUrl && (
        <a className="ghost-button wide link-button" href={song.source.sourcePostUrl}>
          作品を見る
        </a>
      )}

      <div className="primary-actions">
        <button className="primary-button" type="button" onClick={onRetry}>
          もう一度鳴らす
        </button>
        <button className="ghost-button" type="button" onClick={onSongSelect}>
          曲を選ぶ
        </button>
      </div>
    </main>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="metric glass-panel">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function getChiaComment(result: ScoreResult): string {
  if (result.fullCombo) {
    return "一度も途切れなかった。キミの音、最後までちゃんと届いてたよ。";
  }
  if (result.counts.miss >= Math.max(6, result.maxJudgmentCount * 0.28)) {
    return "欠けてても大丈夫。もう一回、そっと鳴らそ？";
  }
  return "キミが鳴らしたぶんだけ、この曲の光が増えたよ。";
}
