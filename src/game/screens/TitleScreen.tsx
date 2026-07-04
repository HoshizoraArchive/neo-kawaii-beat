type TitleScreenProps = {
  onEnter: () => void;
  onSettings: () => void;
};

export function TitleScreen({ onEnter, onSettings }: TitleScreenProps) {
  return (
    <main className="screen title-screen">
      <section className="title-copy">
        <p className="eyebrow">Hoshizora Village Official Game</p>
        <h1>NEO KAWAII BEAT</h1>
        <p className="subtitle">残したい音を、遊べる光へ。</p>
      </section>

      <section className="glass-panel chia-panel" aria-label="星空ちあ案内">
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

      <div className="primary-actions">
        <button className="primary-button" type="button" onClick={onEnter}>
          START
        </button>
        <button className="ghost-button" type="button" onClick={onSettings}>
          設定
        </button>
      </div>
    </main>
  );
}
