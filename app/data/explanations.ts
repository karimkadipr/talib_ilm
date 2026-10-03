// Explanation series. Series built with `s()` are SAMPLE DATA: the scholars
// and books are real, but lesson counts and durations are placeholders and no
// media is linked. Real series list their lessons explicitly with `audioUrl`.

import type { Localized } from "./curriculum";

export type Scholar = {
  id: string;
  name: Localized;
  hue: number;
};

export type Lesson = {
  n: number;
  minutes: number;
  /** YouTube video id; absent until a real recording is linked. */
  videoId?: string;
  /** Direct link to an MP3 (played with <audio>). */
  audioUrl?: string;
};

export type Series = {
  id: string;
  bookId: string;
  scholarId: string;
  lessons: Lesson[];
  /** Where the recordings come from, credited on the book and lesson pages. */
  source?: { name: Localized; url: string };
};

export const scholars: Scholar[] = [
  { id: "uthaymin", name: { ar: "محمد بن صالح العثيمين", en: "Muḥammad ibn Ṣāliḥ al-ʿUthaymīn" }, hue: 163 },
  { id: "fawzan", name: { ar: "صالح بن فوزان الفوزان", en: "Ṣāliḥ al-Fawzān" }, hue: 85 },
  { id: "salih-alash", name: { ar: "صالح بن عبد العزيز آل الشيخ", en: "Ṣāliḥ Āl al-Shaykh" }, hue: 220 },
  { id: "badr", name: { ar: "عبد الرزاق البدر", en: "ʿAbd al-Razzāq al-Badr" }, hue: 30 },
  { id: "abbad", name: { ar: "عبد المحسن العباد", en: "ʿAbd al-Muḥsin al-ʿAbbād" }, hue: 285 },
];

// Deterministic pseudo-random durations so SSR and the client agree.
function lessons(count: number, seed: number, base = 45): Lesson[] {
  return Array.from({ length: count }, (_, i) => {
    const r = Math.sin(seed * 97 + i * 13.37) * 10000;
    const jitter = Math.floor((r - Math.floor(r)) * 30) - 12;
    return { n: i + 1, minutes: Math.max(12, base + jitter) };
  });
}

const s = (bookId: string, scholarId: string, count: number, base?: number): Series => ({
  id: `${bookId}--${scholarId}`,
  bookId,
  scholarId,
  lessons: lessons(count, bookId.length * 31 + scholarId.length, base),
});

/** A real series hosted as one archive.org item, files named 01.mp3, 02.mp3, … */
function archiveSeries(
  bookId: string,
  scholarId: string,
  item: string,
  minutes: number[],
  source: Series["source"],
): Series {
  return {
    id: `${bookId}--${scholarId}`,
    bookId,
    scholarId,
    source,
    lessons: minutes.map((m, i) => ({
      n: i + 1,
      minutes: m,
      audioUrl: `https://archive.org/download/${item}/${String(i + 1).padStart(2, "0")}.mp3`,
    })),
  };
}

const islamweb = (url: string): Series["source"] => ({
  name: { ar: "الشبكة الإسلامية", en: "Islamweb" },
  url,
});

export const series: Series[] = [
  s("usul-thalatha", "uthaymin", 9),
  s("usul-thalatha", "fawzan", 11),
  s("usul-thalatha", "salih-alash", 14, 60),
  archiveSeries(
    "usul-thalatha",
    "badr",
    "badr-sharh-thalathat-al-usul",
    [59, 81, 75, 86, 88, 85, 86, 92, 97, 88, 89, 94, 87, 53, 85, 92, 74],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7939&kh=0"),
  ),
  s("qawaid-arbaa", "fawzan", 2),
  s("qawaid-arbaa", "salih-alash", 3),
  s("usul-sittah", "fawzan", 3),
  s("kitab-tawhid", "uthaymin", 38),
  s("kitab-tawhid", "salih-alash", 42, 70),
  s("kitab-tawhid", "fawzan", 30),
  s("kashf-shubuhat", "uthaymin", 6),
  s("kashf-shubuhat", "fawzan", 8),
  s("wasitiyyah", "uthaymin", 27),
  s("wasitiyyah", "fawzan", 22),
  s("wasitiyyah", "salih-alash", 30, 65),
  s("arbain-nawawi", "uthaymin", 20),
  s("arbain-nawawi", "abbad", 16),
  s("arbain-nawawi", "badr", 12),
  s("umdat-ahkam", "uthaymin", 40),
  s("ajurrumiyyah", "uthaymin", 18, 35),
  s("tafsir-saadi", "badr", 30),
  s("mulakhkhas-fiqhi", "fawzan", 48),
];

export function getScholar(id: string) {
  return scholars.find((x) => x.id === id)!;
}

export function getSeries(id: string) {
  return series.find((x) => x.id === id);
}

export function seriesForBook(bookId: string) {
  return series.filter((x) => x.bookId === bookId);
}

export function totalMinutes(x: Series) {
  return x.lessons.reduce((n, l) => n + l.minutes, 0);
}
