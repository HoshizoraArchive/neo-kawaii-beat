import type { SongAudioSource } from "../engine/types";
import { AudioClock } from "./AudioClock";
import { loadAudioBuffer } from "./loadAudio";

export type ScheduledAudio = {
  clock: AudioClock;
  buffer: AudioBuffer;
};

export class AudioPlayer {
  private audioContext?: AudioContext;
  private gain?: GainNode;
  private source?: AudioBufferSourceNode;
  private preparedSourceKey?: string;
  private preparedBuffer?: AudioBuffer;

  async prepare(source: SongAudioSource): Promise<AudioBuffer> {
    const audioContext = this.ensureAudioContext();
    void this.requestResume();
    const key = JSON.stringify(source);
    if (this.preparedBuffer && this.preparedSourceKey === key) {
      return this.preparedBuffer;
    }

    this.stop();
    const buffer = await loadAudioBuffer(audioContext, source);
    this.preparedSourceKey = key;
    this.preparedBuffer = buffer;
    return buffer;
  }

  async schedule(input: {
    source: SongAudioSource;
    chartOffsetMs: number;
    muted: boolean;
    leadInSeconds?: number;
  }): Promise<ScheduledAudio> {
    const audioContext = this.ensureAudioContext();
    await this.requestResume(250);
    const buffer = await this.prepare(input.source);
    this.stopSourceOnly();

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(this.ensureGain());
    this.setMuted(input.muted);

    const scheduledStartTime = audioContext.currentTime + (input.leadInSeconds ?? 1.2);
    source.start(scheduledStartTime);
    this.source = source;

    return {
      clock: new AudioClock(audioContext, scheduledStartTime, input.chartOffsetMs),
      buffer,
    };
  }

  setMuted(muted: boolean) {
    const gain = this.ensureGain();
    gain.gain.value = muted ? 0 : 0.82;
  }

  getContext(): AudioContext | undefined {
    return this.audioContext;
  }

  stop() {
    this.stopSourceOnly();
  }

  dispose() {
    this.stop();
  }

  private ensureAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new AudioContext({ latencyHint: "interactive" });
      this.gain = this.audioContext.createGain();
      this.gain.connect(this.audioContext.destination);
    }
    return this.audioContext;
  }

  private ensureGain(): GainNode {
    const audioContext = this.ensureAudioContext();
    if (!this.gain) {
      this.gain = audioContext.createGain();
      this.gain.connect(audioContext.destination);
    }
    return this.gain;
  }

  private stopSourceOnly() {
    if (!this.source) return;
    try {
      this.source.stop();
    } catch {
      // The source may already have ended; cleanup is still safe.
    }
    this.source.disconnect();
    this.source = undefined;
  }

  private async requestResume(timeoutMs = 0): Promise<void> {
    const audioContext = this.ensureAudioContext();
    if (audioContext.state === "running") return;

    const resume = audioContext.resume().catch(() => undefined);
    if (timeoutMs <= 0) {
      await resume;
      return;
    }

    await Promise.race([
      resume,
      new Promise<void>((resolve) => {
        window.setTimeout(resolve, timeoutMs);
      }),
    ]);
  }
}
