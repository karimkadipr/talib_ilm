import { href } from "react-router";
import { type Reciter, surahAudioUrl, surahFallbackUrl } from "~/data/reciters";
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

/** Which surah comes before and after `n` in a list of surahs (undefined at either end). */
export type SurahOrder = {
  prev: (n: number) => number | undefined;
  next: (n: number) => number | undefined;
};

/** The order of the mushaf, al-Fātiḥah to an-Nās. */
export const MUSHAF: SurahOrder = { prev: (n) => n - 1, next: (n) => n + 1 };

/**
 * Builds player tracks for a reciter's surahs in the page language. `order` gives the previous and
 * next surah for the players' buttons and picks what follows when one ends (by default the mushaf's
 * order); it's built from plain values, so it still plays on after the listener leaves the page.
 */
export function useSurahTrack() {
  const { l, t, isAr } = useLocalize();
  function make(reciter: Reciter, n: number, order: SurahOrder = MUSHAF): Track {
    const surah = surahs[n - 1];
    const go = (to: number | undefined) =>
      to && to >= 1 && to <= surahs.length ? () => player.play(make(reciter, to, order)) : undefined;
    return {
      id: surahTrackId(reciter.id, n),
      src: surahAudioUrl(reciter, n),
      fallback: surahFallbackUrl(reciter, n),
      book: { id: `surah-${n}`, title: { ar: `سورة ${surah.name}`, en: surah.translit }, author: reciter.name },
      hue: reciter.hue,
      artist: l(reciter.name),
      label: t("quran.surah", { name: isAr ? surah.name : surah.translit }),
      href: `${href("/reciters/:reciterId", { reciterId: reciter.id })}?surah=${n}`,
      duration: reciter.seconds[n - 1],
      artwork: reciter.photo?.src,
      sequence: { prev: go(order.prev(n)), next: go(order.next(n)) },
      // Read when it ends, so later changes (e.g. to the favourites) count.
      onEnded: () => go(order.next(n))?.(),
    };
  }
  return make;
}
