import type { Difficulty, SongDefinition } from "../engine/types";
import type { LocalRecords } from "../storage/localRecords";

type SongSelectScreenProps = {
  songs: SongDefinition[];
  selectedSongId: string;
  selectedDifficulty: Difficulty;
  records: LocalRecords;
  onSelectSong: (songId: string) => void;
  onSelectDifficulty: (difficulty: Difficulty) => void;
  onStart: () => void;
  onSettings: () => void;
};

const difficulties: Difficulty[] = ["easy", "normal", "hard"];

export function SongSelectScreen({
  songs,
  selectedSongId,
  selectedDifficulty,
  records,
  onSelectSong,
  onSelectDifficulty,
  onStart,
  onSettings,
}: SongSelectScreenProps) {
  const selectedSong = songs.find((song) => song.id === selectedSongId) ?? songs[0];
  const best = records.records[selectedSong.id]?.[selectedDifficulty];

  return (
    <main className="screen select-screen">
      <header className="screen-header">
        <div>
          <p className="eyebrow">NEO KAWAII BEAT</p>
          <h1>残したい音を、遊べる光へ。</h1>
        </div>
        <button className="icon-button" type="button" onClick={onSettings} aria-label="設定">
          ⚙
        </button>
      </header>

      <section className="song-list" aria-label="曲選択">
        {songs.map((song) => (
          <button
            key={song.id}
            type="button"
            className={`song-card ${song.id === selectedSongId ? "selected" : ""}`}
            onClick={() => onSelectSong(song.id)}
          >
            <span className="demo-jacket" aria-hidden="true">
              <span />
            </span>
            <span className="song-meta">
              <strong>{song.title}</strong>
              <small>{song.artist}</small>
              <small>
                {song.bpm} BPM / {formatDuration(song.durationMs)}
              </small>
            </span>
          </button>
        ))}
      </section>

      <section className="glass-panel">
        <div className="section-title-row">
          <h2>難易度</h2>
          <p className="best-chip">
            LOCAL BEST {best ? best.score.toLocaleString("ja-JP") : "未観測"}
          </p>
        </div>
        <div className="segmented-control" role="tablist" aria-label="難易度選択">
          {difficulties.map((difficulty) => (
            <button
              key={difficulty}
              type="button"
              className={selectedDifficulty === difficulty ? "active" : ""}
              onClick={() => onSelectDifficulty(difficulty)}
            >
              {difficulty.toUpperCase()}
            </button>
          ))}
        </div>
      </section>

      <button className="primary-button wide" type="button" onClick={onStart}>
        START
      </button>
    </main>
  );
}

function formatDuration(durationMs: number): string {
  const seconds = Math.round(durationMs / 1_000);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}
