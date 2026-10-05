import urls from "./generated/audio-urls.json";
import { getSeries } from "./explanations";

const generated = urls as Record<string, { base: string; files: string[] }>;

/**
 * Audio URL of one lesson. Generated series keep their URLs here on the server (thousands of
 * them), so the browser bundle only carries durations; hand-written series compute theirs.
 */
export function lessonAudioUrl(seriesId: string, n: number): string | undefined {
  const g = generated[seriesId];
  if (g) {
    const file = g.files[n - 1];
    return file && (file.startsWith("https://") ? file : g.base + file);
  }
  return getSeries(seriesId)?.lessons.find((l) => l.n === n)?.audioUrl;
}
