import type { ChartV1, SongDefinition, ValidationResult } from "../engine/types";
import type { GameSettings } from "../storage/localRecords";

type ReadyScreenProps = {
  song: SongDefinition;
  chart: ChartV1;
  settings: GameSettings;
  validation: ValidationResult;
  isStarting: boolean;
  startError: string;
  onStart: () => void;
  onBack: () => void;
  onSettings: () => void;
};

export function ReadyScreen({
  song,
  chart,
  settings,
  validation,
  isStarting,
  startError,
  onStart,
  onBack,
  onSettings,
}: ReadyScreenProps) {
  return (
    <main className="screen ready-screen">
      <header className="screen-header">
        <button className="ghost-button compact" type="button" onClick={onBack}>
          戻る
        </button>
        <button className="ghost-button compact" type="button" onClick={onSettings}>
          設定
        </button>
      </header>

      <section className="glass-panel ready-panel">
        <div className="demo-jacket large" aria-hidden="true">
          <span />
        </div>
        <div>
          <p className="eyebrow">{chart.difficulty.toUpperCase()} / LEVEL {chart.level}</p>
          <h1>{song.title}</h1>
          <p className="muted">{song.artist}</p>
        </div>
      </section>

      <section className="glass-panel chia-panel">
        <div className="chia-placeholder" aria-hidden="true">
          <span className="moon-mark">C</span>
          <span className="star-mark">+</span>
        </div>
        <div>
          <p className="guide-name">星空ちあ｜街の案内人</p>
          <p className="guide-line">この音、ちあと一緒に鳴らそ？</p>
          <p className="muted tiny">キャラクター画像差し替え予定</p>
        </div>
      </section>

      <section className="glass-panel">
        <h2>READY</h2>
        <ul className="ready-list">
          <li>スマホ：4レーン下部をタップ、ホールドは押したまま</li>
          <li>PC：D / F / J / K または矢印キー</li>
          <li>イヤホン推奨。Bluetoothは設定で判定タイミングを調整できます。</li>
          <li>音声：{settings.soundEnabled ? "ON" : "OFF"} / 判定オフセット {settings.judgmentOffsetMs}ms</li>
          <li>{isStarting ? "音声を生成しています。" : "START後、音声を生成して短いカウントダウンに入ります。"}</li>
        </ul>
      </section>

      {(!validation.ok || startError) && (
        <section className="error-panel" role="alert">
          <strong>{validation.ok ? "開始できませんでした。" : "譜面を開始できません。"}</strong>
          {startError && <p>{startError}</p>}
          {!validation.ok &&
            validation.errors.map((error) => (
              <p key={error}>{error}</p>
            ))}
        </section>
      )}

      <button
        className="primary-button wide"
        type="button"
        onClick={onStart}
        disabled={!validation.ok || isStarting}
      >
        {isStarting ? "LOADING" : "START"}
      </button>
    </main>
  );
}
