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
  archiveSeries(
    "kashf-shubuhat",
    "badr",
    "badr-sharh-kashf-al-shubuhat",
    [83, 84, 80, 81, 63, 87, 71, 72, 72, 71, 66],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7975&kh=0"),
  ),
  archiveSeries(
    "tahawiyyah",
    "badr",
    "badr-sharh-al-aqidah-al-tahawiyyah",
    [65, 65, 65, 64, 66, 62, 68, 64, 61, 60, 65, 56, 58, 65, 62, 62, 77, 62, 44, 56, 66, 62],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7906&kh=0"),
  ),
  archiveSeries(
    "hamawiyyah",
    "badr",
    "badr-sharh-al-fatwa-al-hamawiyyah",
    [
      73, 70, 77, 66, 68, 64, 45, 42, 46, 48, 36, 36, 34, 32, 47, 35, 33, 44, 62, 43, 38, 38, 40, 34, 37, 37,
      38, 39, 29, 46, 35, 27, 51, 32, 38, 33, 39,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7912&kh=0"),
  ),
  archiveSeries(
    "umdat-ahkam",
    "badr",
    "badr-sharh-umdat-al-ahkam",
    [
      56, 61, 66, 62, 58, 63, 63, 43, 50, 54, 50, 53, 52, 48, 52, 44, 56, 44, 43, 40, 44, 55, 65, 54, 48, 39,
      32, 64, 59, 55, 36, 51, 60, 44, 45, 39, 48, 48,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7847&kh=0"),
  ),
  archiveSeries(
    "qawaid-hisan",
    "badr",
    "badr-sharh-al-qawaid-al-hisan",
    [
      73, 71, 64, 73, 75, 73, 59, 79, 84, 74, 60, 65, 65, 82, 69, 58, 66, 65, 57, 68, 70, 73, 72, 73, 80, 76,
      58, 83, 71, 67, 58,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7734&kh=0"),
  ),
  archiveSeries(
    "arbain-nawawi",
    "badr",
    "badr-sharh-al-arbain-al-nawawiyyah",
    [
      79, 50, 79, 60, 74, 56, 84, 53, 56, 99, 73, 61, 90, 48, 84, 53, 86, 88, 97, 77, 84, 54, 69, 74, 88, 32,
      64, 105, 70, 65, 62, 62, 62, 64, 66, 64,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7789&kh=0"),
  ),
  archiveSeries(
    "wasitiyyah",
    "badr",
    "badr-sharh-al-aqidah-al-wasitiyyah",
    [
      54, 65, 65, 67, 84, 81, 65, 73, 84, 53, 62, 65, 59, 57, 42, 68, 60, 55, 71, 63, 58, 40, 52, 58, 53, 61,
      52, 65, 63, 46, 46, 47, 58, 78, 59, 62, 53, 56, 67, 64, 62, 63, 57, 42, 62, 42, 69, 44, 59, 55,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7909&kh=0"),
  ),
  archiveSeries(
    "fath-majid",
    "badr",
    "badr-taliq-fath-al-majid",
    [
      36, 39, 42, 36, 47, 27, 32, 40, 39, 34, 43, 34, 37, 43, 32, 30, 33, 35, 42, 31, 37, 42, 37, 31, 39, 21,
      27, 28, 32, 46, 39, 25, 35, 34, 33, 21, 45, 41, 28, 41, 41, 41, 30, 38, 37, 35, 37, 45, 35, 48, 41, 36,
      45, 37, 33, 33, 35, 37, 33, 35, 31, 27, 26, 33, 29, 32, 24, 32, 39, 33, 31, 28, 36, 27, 30, 31, 40, 28,
      34, 26, 33, 38, 26, 31, 20, 24, 27, 29, 30, 34, 33, 19, 26, 28, 27, 32, 25, 41, 33, 25, 34, 36, 25, 29,
      30,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7885&kh=0"),
  ),
  archiveSeries(
    "riyad-salihin",
    "badr",
    "badr-sharh-riyad-al-salihin",
    [
      7, 15, 19, 20, 18, 18, 24, 18, 16, 19, 18, 21, 26, 18, 22, 15, 24, 19, 18, 17, 17, 15, 24, 16, 21, 18,
      21, 18, 15, 18, 18, 22, 9, 17, 26, 47, 25, 18, 22, 20, 17, 13, 17, 17, 21, 16, 16, 14, 16, 17, 19, 14,
      16, 21, 13, 15, 18, 13, 15, 15, 13, 12, 12, 20, 10, 16, 19, 15, 16, 15, 10, 17, 11, 16, 17, 15, 18, 18,
      11, 17, 16, 15, 17, 13, 18, 18, 10, 15, 19, 10, 17, 19, 16, 19, 16, 13, 20, 25, 24, 19, 26, 22, 18, 22,
      25, 19, 26, 25, 15, 25, 26, 11, 21, 18, 27, 27, 29, 37, 25, 26, 25, 25, 26, 29, 25, 19, 20, 14, 26, 20,
      25, 19, 20, 26, 24, 20, 26, 24, 11, 21, 8, 23, 21, 22, 20, 19, 22, 16, 11, 15, 19, 21, 13, 18, 19, 17,
      18, 21, 15, 14, 16, 20, 14, 14, 19, 15, 14, 15, 10, 13, 19, 22, 15, 18, 20, 19, 15, 23, 15, 19, 17, 16,
      20, 17, 20, 21, 21, 19, 17, 15, 20, 7, 22, 14, 20, 22, 22, 24, 17, 29, 20, 24, 24, 23, 21, 23, 21, 19,
      20, 25, 23, 30, 24, 25, 25, 23, 24, 16, 25, 10, 21, 21, 30, 25, 22, 21, 25, 25, 19, 27, 25, 19, 22, 24,
      17, 25, 21, 22, 21, 21, 20, 21, 20, 19, 20, 23, 20, 19, 15, 15, 14, 16, 15, 16, 11, 21, 20, 20, 20, 13,
      13, 15, 16, 22, 17, 18, 15, 16, 13, 13, 16, 18, 15, 10, 16, 14, 16, 14, 15, 13, 19, 25, 14, 15, 23, 18,
      18, 22, 27, 14, 15, 21, 20, 22, 16, 54,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7841&kh=0"),
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
