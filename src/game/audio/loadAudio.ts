import type { SongAudioSource } from "../engine/types";
import { generateDemoTrack } from "./generateDemoTrack";

export async function loadAudioBuffer(
  audioContext: AudioContext,
  source: SongAudioSource,
): Promise<AudioBuffer> {
  if (source.kind === "generated") {
    if (source.generator !== "demo-v1") {
      throw new Error("未対応の生成音源です。");
    }
    return generateDemoTrack(audioContext).buffer;
  }

  const response = await fetch(source.src);
  if (!response.ok) {
    throw new Error("音源ファイルを読み込めませんでした。");
  }

  const arrayBuffer = await response.arrayBuffer();
  return audioContext.decodeAudioData(arrayBuffer);
}
