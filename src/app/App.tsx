import { useMemo, useRef, useState } from "react";
import { AudioPlayer, type ScheduledAudio } from "../game/audio/AudioPlayer";
import { chartsBySong, getChart, getSong, songCatalog } from "../game/content/songCatalog";
import { validateSongCharts } from "../game/engine/chartValidation";
import type { Difficulty, ScoreResult } from "../game/engine/types";
import { InterruptedScreen } from "../game/screens/InterruptedScreen";
import { PlayScreen } from "../game/screens/PlayScreen";
import { ReadyScreen } from "../game/screens/ReadyScreen";
import { ResultScreen } from "../game/screens/ResultScreen";
import { SettingsScreen } from "../game/screens/SettingsScreen";
import { SongSelectScreen } from "../game/screens/SongSelectScreen";
import { TitleScreen } from "../game/screens/TitleScreen";
import {
  loadRecords,
  loadSettings,
  saveRecords,
  saveSettings,
  upsertLocalRecord,
  type GameSettings,
  type LocalRecordEntry,
  type LocalRecords,
} from "../game/storage/localRecords";

type Screen = "title" | "select" | "ready" | "play" | "result" | "settings" | "interrupted";

type ResultContext = {
  result: ScoreResult;
  best: LocalRecordEntry;
  newBest: boolean;
};

export function App() {
  const [screen, setScreen] = useState<Screen>("title");
  const [previousScreen, setPreviousScreen] = useState<Screen>("select");
  const [selectedSongId, setSelectedSongId] = useState(songCatalog[0].id);
  const [selectedDifficulty, setSelectedDifficulty] = useState<Difficulty>("easy");
  const [settings, setSettings] = useState<GameSettings>(() => loadSettings());
  const [records, setRecords] = useState<LocalRecords>(() => loadRecords());
  const [resultContext, setResultContext] = useState<ResultContext | null>(null);
  const [playRunId, setPlayRunId] = useState(0);
  const [scheduledAudio, setScheduledAudio] = useState<ScheduledAudio | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [startError, setStartError] = useState("");
  const audioPlayerRef = useRef(new AudioPlayer());

  const selectedSong = getSong(selectedSongId);
  const selectedChart = getChart(selectedSongId, selectedDifficulty);
  const validation = useMemo(
    () => validateSongCharts(selectedSong, chartsBySong[selectedSong.id], songCatalog),
    [selectedSong],
  );

  const updateSettings = (next: GameSettings) => {
    setSettings(next);
    saveSettings(next);
  };

  const openSettings = () => {
    setPreviousScreen(screen === "settings" ? "select" : screen);
    setScreen("settings");
  };

  const handleComplete = (result: ScoreResult) => {
    const updated = upsertLocalRecord({
      records,
      songId: selectedSong.id,
      difficulty: selectedDifficulty,
      result,
    });
    setRecords(updated.records);
    saveRecords(updated.records);
    setResultContext({
      result,
      best: updated.best,
      newBest: updated.newBest,
    });
    setScreen("result");
  };

  const startRun = async () => {
    if (!validation.ok || isStarting) return;
    setIsStarting(true);
    setStartError("");
    try {
      const scheduled = await audioPlayerRef.current.schedule({
        source: selectedSong.audio,
        chartOffsetMs: selectedChart.offsetMs,
        muted: !settings.soundEnabled,
        leadInSeconds: 1.2,
      });
      setScheduledAudio(scheduled);
      setPlayRunId((value) => value + 1);
      setScreen("play");
    } catch (caught) {
      audioPlayerRef.current.stop();
      setStartError(caught instanceof Error ? caught.message : "音声を開始できませんでした。");
    } finally {
      setIsStarting(false);
    }
  };

  if (screen === "title") {
    return <TitleScreen onEnter={() => setScreen("select")} onSettings={openSettings} />;
  }

  if (screen === "settings") {
    return (
      <SettingsScreen
        settings={settings}
        onChange={updateSettings}
        onBack={() => setScreen(previousScreen === "play" ? "select" : previousScreen)}
      />
    );
  }

  if (screen === "select") {
    return (
      <SongSelectScreen
        songs={songCatalog}
        selectedSongId={selectedSongId}
        selectedDifficulty={selectedDifficulty}
        records={records}
        onSelectSong={setSelectedSongId}
        onSelectDifficulty={setSelectedDifficulty}
        onStart={() => setScreen("ready")}
        onSettings={openSettings}
      />
    );
  }

  if (screen === "ready") {
    return (
      <ReadyScreen
        song={selectedSong}
        chart={selectedChart}
        settings={settings}
        validation={validation}
        isStarting={isStarting}
        startError={startError}
        onStart={() => {
          void startRun();
        }}
        onBack={() => setScreen("select")}
        onSettings={openSettings}
      />
    );
  }

  if (screen === "play" && scheduledAudio) {
    return (
      <PlayScreen
        key={`${selectedSong.id}-${selectedDifficulty}-${playRunId}`}
        song={selectedSong}
        chart={selectedChart}
        settings={settings}
        audioPlayer={audioPlayerRef.current}
        scheduledAudio={scheduledAudio}
        onSettingsChange={updateSettings}
        onComplete={handleComplete}
        onInterrupted={() => setScreen("interrupted")}
      />
    );
  }

  if (screen === "interrupted") {
    return (
      <InterruptedScreen onRetry={() => setScreen("ready")} onSongSelect={() => setScreen("select")} />
    );
  }

  if (resultContext) {
    return (
      <ResultScreen
        song={selectedSong}
        difficulty={selectedDifficulty}
        result={resultContext.result}
        best={resultContext.best}
        newBest={resultContext.newBest}
        onRetry={() => setScreen("ready")}
        onSongSelect={() => setScreen("select")}
      />
    );
  }

  return <SongSelectScreen
    songs={songCatalog}
    selectedSongId={selectedSongId}
    selectedDifficulty={selectedDifficulty}
    records={records}
    onSelectSong={setSelectedSongId}
    onSelectDifficulty={setSelectedDifficulty}
    onStart={() => setScreen("ready")}
    onSettings={openSettings}
  />;
}
