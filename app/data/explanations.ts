// Explanation series. Only series with real recordings are listed; a book
// without any simply shows no explanations yet.

import type { Localized } from "./curriculum";
// Series added from the source research (other scholars and hosts). Only durations live
// here; their audio URLs are in generated/audio-urls.json, read on the server by audio.server.ts.
import generatedJson from "./generated/series.json";

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

const generated = generatedJson as {
  scholars: Scholar[];
  series: { id: string; bookId: string; scholarId: string; source: { name: Localized; url: string }; minutes: number[] }[];
};

export const scholars: Scholar[] = [
  { id: "uthaymin", name: { ar: "محمد بن صالح العثيمين", en: "Muḥammad ibn Ṣāliḥ al-ʿUthaymīn" }, hue: 163 },
  { id: "fawzan", name: { ar: "صالح بن فوزان الفوزان", en: "Ṣāliḥ al-Fawzān" }, hue: 85 },
  { id: "salih-alash", name: { ar: "صالح بن عبد العزيز آل الشيخ", en: "Ṣāliḥ Āl al-Shaykh" }, hue: 220 },
  { id: "badr", name: { ar: "عبد الرزاق البدر", en: "ʿAbd al-Razzāq al-Badr" }, hue: 30 },
  { id: "abbad", name: { ar: "عبد المحسن العباد", en: "ʿAbd al-Muḥsin al-ʿAbbād" }, hue: 285 },
  ...generated.scholars,
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

/**
 * A series streamed from the Shaykh's own site, al-badr.net (/sub/<sub>). Files are
 * <slug>/<lesson zero-padded to `pad`>.mp3. `files` lists the exceptions by lesson number:
 * a suffix the site re-uploaded the file under (e.g. "n" for 005n.mp3), or a full URL for a
 * lesson whose file is broken on the site and is taken from a mirror instead.
 */
function badrNetSeries(
  bookId: string,
  scholarId: string,
  sub: number,
  slug: string,
  pad: number,
  minutes: number[],
  files: Record<number, string> = {},
): Series {
  const url = (n: number) => {
    const file = files[n] ?? "";
    if (file.startsWith("https://")) return file;
    return `https://al-badr.net/download/esound/choroohat/${slug}/${String(n).padStart(pad, "0")}${file}.mp3`;
  };
  return {
    id: `${bookId}--${scholarId}`,
    bookId,
    scholarId,
    source: { name: { ar: "موقع الشيخ عبد الرزاق البدر", en: "al-badr.net" }, url: `https://al-badr.net/sub/${sub}` },
    lessons: minutes.map((m, i) => ({ n: i + 1, minutes: m, audioUrl: url(i + 1) })),
  };
}

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
  archiveSeries(
    "mukhtasar-bukhari-zabidi",
    "badr",
    "badr-sharh-al-tajrid-al-sarih",
    [
      71, 66, 77, 72, 64, 54, 75, 54, 54, 48, 52, 47, 51, 58, 54, 45, 49, 57, 56, 63, 71, 77, 65, 67, 65, 69,
      61, 61, 62, 47, 57, 74, 57, 58, 85, 83, 47, 59, 56, 65, 69, 63, 57, 54, 55, 55, 47, 79, 76, 62, 85, 51,
      69, 49, 46, 54, 43, 49, 51, 49, 36, 34, 50, 43, 60, 62, 32, 47, 31, 40, 54, 33, 68, 39, 54, 54, 24, 57,
      63, 50, 41, 32, 60, 40, 45, 49, 49, 55, 52, 53, 37, 64, 45, 60, 51, 58, 51, 45, 47, 45, 27, 18, 58, 70,
      64, 64, 68, 64, 88, 90, 73, 80, 66, 81, 67, 79, 66, 74, 80, 64, 64, 60, 58, 42, 54, 68, 54, 48, 52, 60,
      60, 57, 61, 52, 60, 43, 62, 82, 41, 76, 34, 39, 64, 36, 31, 44, 49, 46, 37, 52, 50, 57, 46, 40, 34, 46,
      44, 49, 37, 39, 44, 23, 43, 49, 48, 53, 58, 43, 38, 39, 42, 38, 39, 42, 44, 38, 43, 37, 52, 45, 45, 42,
      36, 21, 38, 24, 39, 39, 45, 28, 46, 16, 29, 42, 28, 37, 21, 25, 38, 57, 25, 17, 36, 17, 39, 55, 45, 49,
      36, 37, 50, 41, 38, 37, 38, 37, 38, 46, 39, 41, 29, 41, 45, 51, 33, 47, 51, 45, 50, 61, 50, 28, 24, 38,
      57, 56, 50, 52, 49, 43, 40, 39, 37, 27, 47, 50, 59, 54, 47, 35, 58, 37, 29, 46, 30, 27, 53, 33, 34, 23,
      43, 46, 42, 62, 42, 49,
    ],
    islamweb("https://audio.islamweb.net/audio/index.php?page=lecview&sid=2735&read=0&lg=7807&kh=0"),
  ),
  badrNetSeries(
    "shamail",
    "badr",
    190,
    "syamail-nabi",
    2,
    [
      58, 64, 64, 64, 64, 66, 62, 64, 67, 62, 64, 68, 65, 63, 64, 61, 66, 65, 59, 68, 65, 67, 64, 65, 63, 67,
      59, 84, 62, 80, 73, 66, 59, 56, 67, 68, 66, 58, 64, 68, 58, 64, 73, 73, 69,
    ],
  ),
  badrNetSeries(
    "manhaj-salikin",
    "badr",
    444,
    "syarhmanhajussalikin",
    3,
    [
      61, 62, 52, 61, 55, 55, 58, 61, 59, 57, 59, 59, 56, 55, 58, 54, 57, 62, 56, 60, 60, 61, 59, 47, 59, 60,
      59, 58, 53, 60, 51, 58, 59, 57, 58, 65, 58, 62, 61, 59, 61, 53, 58, 35, 55, 59, 54, 59, 60, 59, 54, 58,
      45, 56, 59, 60,
    ],
    { 5: "n", 16: "n", 31: "https://www.mimham.net/tan-46167-55", 40: "n", 43: "n", 50: "n", 54: "m" },
  ),
  badrNetSeries(
    "tanbihat-saniyyah",
    "badr",
    468,
    "tanbihat-saniyah-alal-wasitiyah",
    2,
    [
      59, 63, 61, 61, 57, 57, 59, 50, 53, 54, 56, 62, 55, 54, 61, 63, 63, 58, 61, 57, 59, 59, 58, 62, 60, 42,
      41, 56, 58, 59, 62, 57, 55, 54, 50, 40, 58, 51, 58, 59, 60, 61, 61, 60, 63, 60, 62, 63, 60, 61, 60, 63,
      64, 52, 58, 60, 63, 60, 61, 61, 56, 56, 59, 58, 57, 59, 57, 59, 59, 52, 57, 41, 59, 60, 59, 58, 50, 58,
      60, 48, 59, 44, 61, 56, 43, 56, 65, 59, 64, 63, 59, 60, 53, 62, 62, 42, 60, 63, 62, 33, 59, 63, 59, 38,
      48, 61, 53, 57, 54, 59, 54, 57, 61, 59, 58, 61, 55, 61, 60, 60, 48, 52, 50,
    ],
  ),
  badrNetSeries(
    "mukhtasar-muslim",
    "badr",
    419,
    "mukhtasor-sahih-muslim",
    3,
    [
      45, 49, 42, 45, 37, 38, 41, 44, 35, 42, 32, 40, 35, 24, 26, 39, 27, 31, 27, 31, 23, 40, 41, 46, 39, 31,
      38, 38, 44, 36, 30, 33, 31, 37, 33, 34, 33, 36, 36, 37, 32, 42, 30, 42, 30, 34, 45, 39, 36, 38, 45, 34,
      43, 43, 37, 50, 43, 40, 51, 30, 45, 39, 46, 39, 44, 35, 28, 41, 35, 31, 25, 45, 48, 39, 33, 36, 43, 47,
      53, 29, 41, 39, 39, 37, 34, 34, 31, 43, 41, 43, 32, 40, 36, 33, 35, 38, 41, 41, 34, 39, 41, 31, 37, 38,
      37, 35, 36, 37, 33, 36, 40, 36, 35, 34, 43, 40, 39, 37, 32, 34, 28, 30, 25, 34, 31, 34, 27, 30, 37, 38,
      34, 38, 42, 37, 32, 27, 43, 46, 47, 37, 37, 45, 44, 48, 41, 46, 36, 43, 48, 42, 52, 49, 46, 49, 46, 44,
      52, 48, 54, 42, 41, 40, 39, 40, 43, 43, 45, 41, 49, 47, 63, 42, 37, 36, 36, 23, 38, 39, 28, 40, 40, 37,
      41, 36, 31, 39, 30, 41, 34, 26, 37, 28, 40, 36, 30, 31, 34, 34, 34, 35, 38, 41, 37, 38, 41, 42, 34, 43,
      41, 38, 31, 38, 41, 34, 31, 37, 39, 34, 38, 42, 32, 36, 39, 34, 39, 33, 24, 34, 35, 36, 41, 41, 39, 39,
      37, 43, 40, 52, 33, 38, 39, 40, 39, 46, 42, 31, 42, 37, 39, 29, 42, 53, 45, 40, 40, 45, 41, 35, 45, 43,
      42, 36, 40, 42, 44, 32, 50, 39, 41, 45, 40, 44, 33, 44, 36, 48, 34, 36, 22, 37, 36, 34, 38, 36, 40, 38,
      30, 36, 36, 42, 39, 39, 34, 35, 35, 30, 36, 44, 43, 30, 41, 38, 44, 38, 36, 35, 40, 33, 30, 34, 35, 34,
      22, 30, 42, 35, 39, 33, 33, 41, 38, 46, 34, 37, 35, 39, 38, 41, 39, 41, 43, 40, 47, 26, 42, 31, 42, 44,
      44, 32, 55, 40, 47, 51, 50, 38, 35, 36, 30, 28, 44, 31, 37, 31, 24, 42, 44, 40, 28, 31, 37, 52, 42, 48,
      47, 36, 37, 43, 44, 36, 39, 52, 45, 38, 44, 46, 51, 42, 32, 43, 40, 38, 37, 62, 47, 49, 50, 44, 45, 52,
      35, 42, 49, 43, 30, 51, 51, 45, 52, 61, 51, 53, 52, 51, 63, 47, 48, 44, 42, 46, 46, 47, 40, 43, 53, 48,
      42, 35, 37, 42, 45, 43, 39, 35, 39, 43, 38, 42, 38, 41, 39, 38, 37, 44, 42, 40, 45, 38, 40,
    ],
    { 234: "n" },
  ),
  badrNetSeries(
    "tafsir-saadi",
    "badr",
    456,
    "tafsir-assidi",
    3,
    [
      36, 38, 51, 42, 46, 39, 38, 37, 42, 39, 44, 40, 38, 40, 41, 39, 37, 27, 31, 32, 36, 34, 29, 29, 37, 46,
      45, 44, 36, 37, 40, 36, 37, 41, 35, 40, 49, 38, 32, 33, 38, 39, 42, 28, 37, 32, 35, 32, 34, 36, 35, 34,
      44, 40, 42, 42, 36, 31, 33, 44, 43, 32, 43, 49, 34, 39, 36, 51, 38, 41, 48, 40, 44, 45, 40, 40, 38, 42,
      43, 45, 40, 41, 33, 36, 44, 40, 32, 50, 39, 32, 42, 42, 32, 41, 36, 39, 39, 40, 37, 34, 35, 38, 34, 40,
      42, 41, 37, 40, 36, 43, 29, 40, 28, 37, 36, 42, 30, 35, 21, 23, 40, 42, 46, 39, 30, 38, 37, 34, 43, 36,
      37, 54, 39, 48, 36, 36, 36, 49, 48, 38, 51, 48, 43, 39, 47, 49, 53, 35, 47, 32, 41, 35, 36, 41, 29, 35,
      29, 34, 32, 29, 34, 46, 45, 35, 47, 42, 30, 34, 42, 41, 37, 51, 42, 44, 37, 47, 38, 35, 41, 52, 47, 56,
      41, 47, 33, 44, 59, 51, 59, 45, 40, 61, 48, 49, 44, 32, 51, 42, 31, 44, 43, 36, 42, 33, 37, 34, 45, 39,
      31, 45, 42, 37, 36, 37, 34, 37, 40, 40, 38, 28, 34, 44, 36, 40, 39, 32, 32, 32, 32, 34, 26, 33, 28, 41,
      42, 41, 32, 36, 36, 42, 40, 41, 37, 38, 31, 37, 38, 37, 36, 31, 43, 37, 38, 47, 44, 43, 30, 33, 33, 37,
      29, 41, 35, 34, 42, 48, 47, 39, 42, 22, 39, 39, 40, 37, 34, 42, 28, 39, 41, 39, 33, 41, 35, 44, 37, 42,
      41, 37, 44, 38, 45, 50, 46, 41, 38, 39, 39, 40, 37, 37, 36, 39, 39, 45, 42, 41, 38, 38, 35, 31, 48, 39,
      39, 41, 32, 38, 42, 30, 28, 36, 26, 34, 45, 30, 44, 38, 38, 35, 26, 36, 44, 40, 45, 51, 36, 17, 36, 44,
      41, 40, 40, 47, 40, 37, 41, 38, 40, 44, 54, 38, 36, 32, 40, 30, 28, 31, 31, 37, 39, 37, 42, 37, 38, 41,
      32, 33, 35, 27, 35, 47, 47, 43, 44, 47, 39, 38, 33, 41, 36, 46, 52, 55, 44, 53, 37, 51, 43, 40, 45, 52,
      52, 48, 44, 47, 43, 35, 38, 51, 40, 50, 50, 54, 43, 47, 48, 26, 47, 39, 40, 44, 35, 43, 31, 35, 29, 28,
      43, 37, 34, 34, 37, 34, 39, 40, 32, 38, 41, 40, 38, 34, 42, 38, 34, 35, 33,
    ],
    { 48: "n", 64: "n", 71: "n", 97: "n", 172: "n", 193: "n2", 353: "n", 360: "n", 401: "n" },
  ),
  ...generated.series.map(
    (g): Series => ({
      id: g.id,
      bookId: g.bookId,
      scholarId: g.scholarId,
      source: g.source,
      lessons: g.minutes.map((m, i) => ({ n: i + 1, minutes: m })),
    }),
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
