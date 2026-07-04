export class AudioClock {
  constructor(
    private readonly audioContext: AudioContext,
    private readonly scheduledStartTimeSeconds: number,
    private readonly chartOffsetMs: number,
  ) {}

  get outputTimeSeconds(): number {
    const timestamp = this.audioContext.getOutputTimestamp?.();
    const contextTime = timestamp?.contextTime;
    const performanceTime = timestamp?.performanceTime;
    if (
      typeof contextTime === "number" &&
      typeof performanceTime === "number" &&
      Number.isFinite(contextTime) &&
      Number.isFinite(performanceTime)
    ) {
      return contextTime + (performance.now() - performanceTime) / 1_000;
    }

    return this.audioContext.currentTime - (this.audioContext.outputLatency ?? 0);
  }

  get scheduledStartTime(): number {
    return this.scheduledStartTimeSeconds;
  }

  getSongPositionMs(): number {
    return (this.outputTimeSeconds - this.scheduledStartTimeSeconds) * 1_000 - this.chartOffsetMs;
  }

  getCountdownSeconds(): number {
    return Math.max(0, this.scheduledStartTimeSeconds - this.outputTimeSeconds);
  }
}
