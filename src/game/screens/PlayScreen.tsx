import { useCallback, useEffect, useRef, useState } from "react";
import { AudioPlayer, type ScheduledAudio } from "../audio/AudioPlayer";
import { RhythmEngine } from "../engine/RhythmEngine";
import type { ChartV1, ScoreResult, SongDefinition } from "../engine/types";
import { createInputController } from "../input/inputController";
import { GameCanvas } from "../render/GameCanvas";
import type { GameSettings } from "../storage/localRecords";

type PlayScreenProps = {
  song: SongDefinition;
  chart: ChartV1;
  settings: GameSettings;
  audioPlayer: AudioPlayer;
  scheduledAudio?: ScheduledAudio;
  onSettingsChange: (settings: GameSettings) => void;
  onComplete: (result: ScoreResult) => void;
  onInterrupted: () => void;
};

export function PlayScreen({
  song,
  chart,
  settings,
  audioPlayer,
  scheduledAudio,
  onSettingsChange,
  onComplete,
  onInterrupted,
}: PlayScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const engineRef = useRef<RhythmEngine>();
  const endedRef = useRef(false);
  const initialSettingsRef = useRef(settings);
  const onCompleteRef = useRef(onComplete);
  const onInterruptedRef = useRef(onInterrupted);
  const [engine, setEngine] = useState<RhythmEngine | null>(null);

  useEffect(() => {
    onCompleteRef.current = onComplete;
  }, [onComplete]);

  useEffect(() => {
    onInterruptedRef.current = onInterrupted;
  }, [onInterrupted]);

  const interrupt = useCallback(() => {
    if (endedRef.current) return;
    endedRef.current = true;
    engineRef.current?.cancelAllInputs();
    engineRef.current?.dispose();
    audioPlayer.stop();
    onInterruptedRef.current();
  }, [audioPlayer]);

  useEffect(() => {
    document.body.classList.add("is-playing");
    return () => {
      document.body.classList.remove("is-playing");
    };
  }, []);

  useEffect(() => {
    if (!scheduledAudio) return undefined;

    const createdEngine = new RhythmEngine({
      chart,
      clock: scheduledAudio.clock,
      songDurationMs: song.durationMs,
      judgmentOffsetMs: initialSettingsRef.current.judgmentOffsetMs,
      onComplete: (result) => {
        if (endedRef.current) return;
        endedRef.current = true;
        audioPlayer.stop();
        onCompleteRef.current(result);
      },
    });

    engineRef.current = createdEngine;
    setEngine(createdEngine);

    const context = audioPlayer.getContext();
    if (context) {
      context.onstatechange = () => {
        if (!endedRef.current && context.state === "suspended") {
          interrupt();
        }
      };
    }

    const suspendedWatchdog = window.setTimeout(() => {
      const currentContext = audioPlayer.getContext();
      if (!endedRef.current && currentContext?.state === "suspended") {
        interrupt();
      }
    }, 3_500);

    return () => {
      window.clearTimeout(suspendedWatchdog);
      const context = audioPlayer.getContext();
      if (context) {
        context.onstatechange = null;
      }
      createdEngine.dispose();
    };
  }, [audioPlayer, chart, interrupt, scheduledAudio, song.durationMs]);

  useEffect(() => {
    if (!engine || !canvasRef.current) return undefined;

    const controller = createInputController({
      target: canvasRef.current,
      callbacks: {
        laneDown: (lane) => engine.laneDown(lane),
        laneUp: (lane) => engine.laneUp(lane),
        cancelAll: () => engine.cancelAllInputs(),
      },
    });

    return () => {
      controller.dispose();
    };
  }, [engine]);

  useEffect(() => {
    const onVisibilityChange = () => {
      if (document.hidden) {
        interrupt();
      }
    };
    const onPageHide = () => interrupt();

    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", onPageHide);
    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", onPageHide);
    };
  }, [interrupt]);

  const toggleSound = () => {
    const next = { ...settings, soundEnabled: !settings.soundEnabled };
    onSettingsChange(next);
    audioPlayer.setMuted(!next.soundEnabled);
  };

  return (
    <main className="play-screen" aria-label="プレイ画面">
      <div className="play-hud">
        <button className="hud-button" type="button" onClick={interrupt}>
          中断
        </button>
        <div className="hud-title">
          <span>{song.title}</span>
          <small>{chart.difficulty.toUpperCase()}</small>
        </div>
        <button className="hud-button" type="button" onClick={toggleSound}>
          {settings.soundEnabled ? "音ON" : "音OFF"}
        </button>
      </div>

      {engine ? (
        <GameCanvas ref={canvasRef} engine={engine} />
      ) : (
        <div className="play-overlay">
          <p>音声を準備しています</p>
        </div>
      )}
    </main>
  );
}
