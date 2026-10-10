import { href } from "react-router";
import { type Reciter, surahAudioUrl } from "~/data/reciters";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";
import { player, type Track } from "~/lib/player";

/** Track id of a reciter's surah; `surahFromTrack` reads it back. */
export const surahTrackId = (reciterId: string, n: number) => `quran:${reciterId}:${n}`;

/** The surah number if `trackId` is one of this reciter's surahs, else 0. */
export function surahFromTrack(reciterId: string, trackId: string | undefined) {
  const prefix = `quran:${reciterId}:`;
  return trackId?.startsWith(prefix) ? Number(trackId.slice(prefix.length)) : 0;
}

/**
 * Builds player tracks for a reciter's surahs in the page language. When one ends, `next` picks
 * what follows (by default the next surah of the mushaf); it's built from plain values, so it
 * still plays on after the listener leaves the page.
 */
export function useSurahTrack() {
  const { l, t, isAr } = useLocalize();
  function make(reciter: Reciter, n: number, next: (n: number) => number | undefined = (x) => x + 1): Track {
    const surah = surahs[n - 1];
    return {
      id: surahTrackId(reciter.id, n),
      src: surahAudioUrl(reciter, n),
      book: { id: `surah-${n}`, title: { ar: `سورة ${surah.name}`, en: surah.translit }, author: reciter.name },
      hue: reciter.hue,
      artist: l(reciter.name),
      label: t("quran.surah", { name: isAr ? surah.name : surah.translit }),
      href: `${href("/reciters/:reciterId", { reciterId: reciter.id })}?surah=${n}`,
      duration: reciter.seconds[n - 1],
      artwork: reciter.photo?.src,
      onEnded: () => {
        const after = next(n);
        if (after && after >= 1 && after <= surahs.length) player.play(make(reciter, after, next));
      },
    };
  }
  return make;
}
