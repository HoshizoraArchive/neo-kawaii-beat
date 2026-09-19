import type { GameSettings } from "../storage/localRecords";

type SettingsScreenProps = {
  settings: GameSettings;
  onChange: (settings: GameSettings) => void;
  onBack: () => void;
};

export function SettingsScreen({ settings, onChange, onBack }: SettingsScreenProps) {
  const updateOffset = (value: number) => {
    onChange({ ...settings, judgmentOffsetMs: value });
  };

  return (
    <main className="screen settings-screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">SETTINGS</p>
          <h1>判定タイミング</h1>
        </div>
        <button className="ghost-button compact" type="button" onClick={onBack}>
          戻る
        </button>
      </header>

      <section className="glass-panel">
        <div className="setting-row">
          <div>
            <h2>判定オフセット</h2>
            <p className="muted">
              早い判定が多い場合はプラス方向、遅い判定が多い場合はマイナス方向へ調整します。
            </p>
          </div>
          <strong>{settings.judgmentOffsetMs}ms</strong>
        </div>
        <input
          className="offset-slider"
          type="range"
          min="-200"
          max="200"
          step="5"
          value={settings.judgmentOffsetMs}
          onChange={(event) => updateOffset(Number(event.target.value))}
        />
        <div className="setting-scale">
          <span>-200ms</span>
          <span>0ms</span>
          <span>+200ms</span>
        </div>
        <p className="muted tiny">
          Bluetoothイヤホンでは遅延が増える可能性があります。リザルトの早押し／遅押し傾向を見て調整してください。
        </p>
      </section>

      <section className="glass-panel setting-toggle-row">
        <div>
          <h2>サウンド</h2>
          <p className="muted">OFFでも音声時計は進み、判定の基準は変わりません。</p>
        </div>
        <label className="toggle">
          <input
            type="checkbox"
            checked={settings.soundEnabled}
            onChange={(event) => onChange({ ...settings, soundEnabled: event.target.checked })}
          />
          <span>{settings.soundEnabled ? "ON" : "OFF"}</span>
        </label>
      </section>
    </main>
  );
}
