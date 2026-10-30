// What the Qur'an search (quran-search.server.ts, /api/loaders/mushaf/:mushafId/search) answers.

export type QuranHit =
  /** An ayah, numbered in the riwayah searched; `text` is its words (without its number). */
  | { kind: "ayah"; surah: number; n: number; page: number; text: string }
  | { kind: "page"; page: number; surah: number }
  | { kind: "surah"; surah: number; page: number }
  /** A reference past the surah's end: it has `ayahs` ayat in this riwayah. */
  | { kind: "missing"; surah: number; n: number; ayahs: number };

export type QuranSearch = {
  /** References first (an ayah, a page, surahs), then ayat containing the words. */
  hits: QuranHit[];
  /** How many ayat contain the words (more than the hits listed when there are many). */
  wordMatches: number;
};

/** Where the Qur'an search's word matching comes from (its text is kept verbatim, as its licence asks). */
export const quranSearchSource = { name: "Tanzil.net", url: "https://tanzil.net" };
