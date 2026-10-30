// The Qur'an search: an ayah by reference ("2:255", "البقرة 255", "Baqarah 255"), a page ("p 50",
// "ص 50"), a surah by name or number, or the ayat containing some words. Words are matched against
// Tanzil's Ḥafṣ text in everyday spelling (./quran-search/simple-clean.txt, kept verbatim as its
// licence asks), since readers type «الصلاة», not the mushaf's «ٱلصَّلَوٰةَ»; a hit is then shown as the
// riwayah's own ayah holding it, with its number and page in that riwayah.

import { getMushafText, pageCount, getPage } from "./mushaf.server";
import type { MushafId } from "./mushafs";
import type { QuranHit, QuranSearch } from "./quran-search";
import { surahs } from "./surahs";
import { surahMatches } from "~/lib/surah-search";
import raw from "./quran-search/simple-clean.txt?raw";

/** Arabic as readers type it: no diacritics or Qur'anic marks, one alif, tāʾ marbūṭah as hāʾ, yāʾ dotted. */
function plain(s: string) {
  return s
    .replace(/[ً-ٰٟۖ-ۭـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/\s+/g, " ")
    .trim();
}

/** Ḥafṣ's ayat in everyday spelling, plain, by surah. */
const simple: string[][] = Array.from({ length: 114 }, () => []);
for (const line of raw.split(/\r?\n/)) {
  const m = line.match(/^(\d+)\|(\d+)\|(.*)$/);
  if (!m) continue;
  const [surah, n] = [Number(m[1]), Number(m[2])];
  let text = plain(m[3]);
  // Tanzil's text opens each surah's first ayah with the basmala, which is no part of it (but in al-Fātiḥah).
  if (n === 1 && surah !== 1) text = text.replace(/^بسم الله الرحمن الرحيم /, "");
  simple[surah - 1][n - 1] = ` ${text} `;
}

/** Per riwayah and surah, its ayah holding each of Ḥafṣ's ayat. */
const byHafs = new Map<MushafId, number[][]>();
function riwayahAyah(id: MushafId, surah: number, hafs: number) {
  let map = byHafs.get(id);
  if (!map) {
    map = getMushafText(id).map((s) => {
      const of: number[] = [];
      for (const a of s.ayahs) for (const h of a.hafsAyahs) of[h - 1] ??= a.n;
      return of;
    });
    byHafs.set(id, map);
  }
  return map[surah - 1][hafs - 1];
}

const LIMIT = 50;

export function searchQuran(id: MushafId, query: string): QuranSearch {
  const text = getMushafText(id);
  const q = query.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  const hits: QuranHit[] = [];
  if (!q) return { hits, wordMatches: 0 };

  const ayah = (surah: number, n: number): QuranHit => {
    const a = text[surah - 1]?.ayahs[n - 1];
    if (!a) return { kind: "missing", surah, n, ayahs: text[surah - 1].ayahs.length };
    return { kind: "ayah", surah, n, page: a.page, text: a.text.replace(/\s*[٠-٩]+$/, "") };
  };
  const surahHit = (n: number): QuranHit => ({ kind: "surah", surah: n, page: text[n - 1].ayahs[0].page });

  let m: RegExpMatchArray | null;
  if ((m = q.match(/^(?:p|pg|page|ص|صفحة|صفحه)\s*\.?\s*(\d+)$/i))) {
    // A page.
    const page = Number(m[1]);
    const sections = getPage(id, page);
    if (sections) hits.push({ kind: "page", page, surah: sections[0].surah });
    return { hits, wordMatches: 0 };
  }
  if ((m = q.match(/^(\d{1,3})\s*[:：.\-/،,\s]\s*(\d{1,3})$/))) {
    // Surah and ayah numbers.
    const surah = Number(m[1]);
    if (surah >= 1 && surah <= 114) hits.push(ayah(surah, Number(m[2])));
    return { hits, wordMatches: 0 };
  }
  if ((m = q.match(/^\d{1,3}$/))) {
    // A bare number: the surah, or the page.
    const n = Number(m[0]);
    if (n >= 1 && n <= 114) hits.push(surahHit(n));
    if (n >= 1 && n <= pageCount(id)) hits.push({ kind: "page", page: n, surah: getPage(id, n)![0].surah });
    return { hits, wordMatches: 0 };
  }
  if ((m = q.match(/^(.+?)\s*[:،,\s]\s*(\d{1,3})$/))) {
    // A surah's name and an ayah number: the best-matching surah (its name as typed, or else the first).
    const name = m[1].replace(/^(?:سورة|سوره|surah|sura|sourate)\s+/i, "");
    const found = surahs.filter((s) => surahMatches(s, name, s.meaning.en ?? ""));
    const best = found.find((s) => plain(s.name) === plain(name)) ?? found[0];
    if (best) return { hits: [ayah(best.n, Number(m[2]))], wordMatches: 0 };
  }

  // Surahs by name, then the ayat containing the words.
  for (const s of surahs) if (surahMatches(s, q, s.meaning.en ?? "")) hits.push(surahHit(s.n));
  const words = plain(q);
  let wordMatches = 0;
  if (/[ء-ي]{2}/.test(words)) {
    const seen = new Set<string>();
    for (const [i, ayat] of simple.entries())
      for (const [j, a] of ayat.entries()) {
        if (!a.includes(words)) continue;
        // Two of Ḥafṣ's ayat can be one of the riwayah's: list it once.
        const n = riwayahAyah(id, i + 1, j + 1);
        const key = `${i + 1}:${n}`;
        if (seen.has(key)) continue;
        seen.add(key);
        if (++wordMatches <= LIMIT) hits.push(ayah(i + 1, n));
      }
  }
  return { hits, wordMatches };
}
