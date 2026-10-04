// Explanation series. Only series with real recordings are listed; a book
// without any simply shows no explanations yet.

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

/** A series hosted as one archive.org item, files named 01.mp3, 02.mp3, … */
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
  archiveSeries(
    "usul-thalatha",
    "badr",
    "badr-sharh-thalathat-al-usul",
    [59, 81, 75, 86, 88, 85, 86, 92, 97, 88, 89, 94, 87, 53, 85, 92, 74],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7939&kh=0"),
  ),
  archiveSeries(
    "qawaid-arbaa",
    "badr",
    "badr-sharh-al-qawaid-al-arbaa",
    [70, 73, 74],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&kh=0&lg=7918"),
  ),
  archiveSeries(
    "usul-sittah",
    "badr",
    "badr-sharh-al-usul-al-sittah",
    [67, 56, 78],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7898&kh=0"),
  ),
  archiveSeries(
    "kitab-tawhid",
    "badr",
    "badr-sharh-kitab-al-tawhid",
    [
      59, 56, 61, 64, 65, 58, 62, 63, 61, 60, 60, 61, 59, 62, 61, 59, 53, 54, 58, 76, 62, 63, 62, 67, 71, 61, 63,
      62, 65, 59, 66, 63, 59, 64, 64, 67, 61, 62, 66, 63, 92, 74, 80, 78, 57, 64, 64, 66, 63, 51, 61, 53, 53, 59, 62,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7969&kh=0"),
  ),
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
