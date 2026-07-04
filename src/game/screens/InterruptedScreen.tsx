type InterruptedScreenProps = {
  onRetry: () => void;
  onSongSelect: () => void;
};

export function InterruptedScreen({ onRetry, onSongSelect }: InterruptedScreenProps) {
  return (
    <main className="screen interrupted-screen">
      <section className="glass-panel">
        <p className="eyebrow">観測中断</p>
        <h1>画面が切り替わったため、今回の観測を中断しました。</h1>
        <p className="muted">このランはローカルBESTへ保存していません。</p>
      </section>
      <div className="primary-actions">
        <button className="primary-button" type="button" onClick={onRetry}>
          同じ曲を最初からやり直す
        </button>
        <button className="ghost-button" type="button" onClick={onSongSelect}>
          曲選択へ戻る
        </button>
      </div>
    </main>
  );
}
