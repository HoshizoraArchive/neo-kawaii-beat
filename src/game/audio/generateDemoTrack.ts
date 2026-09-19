const DEMO_DURATION_SECONDS = 24;
const DEMO_BPM = 120;

export type GeneratedTrackInfo = {
  buffer: AudioBuffer;
  durationMs: number;
  bpm: number;
};

export function generateDemoTrack(audioContext: AudioContext): GeneratedTrackInfo {
  const sampleRate = audioContext.sampleRate;
  const totalSamples = Math.floor(DEMO_DURATION_SECONDS * sampleRate);
  const buffer = audioContext.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);
  const secondsPerBeat = 60 / DEMO_BPM;

  for (let i = 0; i < totalSamples; i += 1) {
    const time = i / sampleRate;
    const beat = time / secondsPerBeat;
    const bar = Math.floor(beat / 4);
    const beatInBar = beat % 4;

    const kick = drumPulse(beatInBar, 0, 0.105, 58, time, 0.92);
    const snare = noisePulse(time, beatInBar, 2, 0.13, i, 0.23);
    const hat = noisePulse(time, (beat * 2) % 1, 0, 0.035, i * 17, 0.06);

    const chordRoot = [261.63, 329.63, 392, 293.66][bar % 4];
    const synth =
      softOsc(time, chordRoot, 0.1) +
      softOsc(time, chordRoot * 1.25, 0.07) +
      softOsc(time, chordRoot * 1.5, 0.06);

    const leadPattern = [0, 7, 9, 12, 7, 5, 4, 2];
    const step = Math.floor(beat * 2) % leadPattern.length;
    const leadFreq = 523.25 * 2 ** (leadPattern[step] / 12);
    const leadGate = envelope((beat * 2) % 1, 0.05, 0.42);
    const lead = triangle(time, leadFreq) * leadGate * (bar >= 1 ? 0.13 : 0.08);

    const sidechain = 0.82 + 0.18 * Math.min(1, beatInBar / 0.28);
    const mix = clamp(kick + snare + hat + (synth + lead) * sidechain, -0.95, 0.95);
    const pan = Math.sin(time * Math.PI * 0.25) * 0.08;

    left[i] = mix * (0.88 - pan);
    right[i] = mix * (0.88 + pan);
  }

  return {
    buffer,
    durationMs: DEMO_DURATION_SECONDS * 1_000,
    bpm: DEMO_BPM,
  };
}

function drumPulse(
  beatInBar: number,
  targetBeat: number,
  lengthBeats: number,
  frequency: number,
  time: number,
  gain: number,
): number {
  const distance = positiveBeatDistance(beatInBar, targetBeat);
  if (distance > lengthBeats) return 0;
  const env = Math.exp(-distance * 38);
  return Math.sin(time * Math.PI * 2 * (frequency + env * 72)) * env * gain;
}

function noisePulse(
  time: number,
  beatPosition: number,
  target: number,
  lengthBeats: number,
  seed: number,
  gain: number,
): number {
  const distance = positiveBeatDistance(beatPosition, target);
  if (distance > lengthBeats) return 0;
  const env = Math.exp(-distance * 24);
  const noise = pseudoNoise(seed + Math.floor(time * 12_000));
  return noise * env * gain;
}

function softOsc(time: number, frequency: number, gain: number): number {
  const wobble = Math.sin(time * Math.PI * 2 * 0.2) * 2.5;
  return Math.sin(time * Math.PI * 2 * (frequency + wobble)) * gain;
}

function triangle(time: number, frequency: number): number {
  return 2 * Math.abs(2 * ((time * frequency) % 1) - 1) - 1;
}

function envelope(phase: number, attack: number, release: number): number {
  if (phase < attack) return phase / attack;
  if (phase < release) return 1 - (phase - attack) / (release - attack);
  return 0;
}

function positiveBeatDistance(position: number, target: number): number {
  return position >= target ? position - target : Number.POSITIVE_INFINITY;
}

function pseudoNoise(seed: number): number {
  const value = Math.sin(seed * 12.9898) * 43_758.5453;
  return (value - Math.floor(value)) * 2 - 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}
