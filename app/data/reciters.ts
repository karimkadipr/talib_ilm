// Qur'an reciters. Each one's complete recitation is hosted as one archive.org item with the
// surahs named by number: 001.mp3 … 114.mp3.

import type { Localized } from "./curriculum";

export type Reciter = {
  id: string;
  name: Localized;
  hue: number;
  riwayah: Localized;
  /** archive.org item holding 001.mp3 … 114.mp3. */
  item: string;
  /** Length of each surah's recording in seconds, surah 1 first. */
  seconds: number[];
  /** Where the recordings come from, credited on the reciter's page. */
  source: { name: Localized; url: string };
};

const hafs: Localized = { ar: "رواية حفص عن عاصم", en: "Ḥafṣ ʿan ʿĀṣim", fr: "Ḥafṣ ʿan ʿĀṣim" };
const mp3quran = (path: string) => ({ name: { ar: "موقع MP3 Quran", en: "MP3 Quran" }, url: `https://mp3quran.net/${path}` });

export const reciters: Reciter[] = [
  {
    id: "badr-al-turki",
    name: { ar: "بدر التركي", en: "Badr al-Turkī", fr: "Badr al-Turkī" },
    hue: 190,
    riwayah: hafs,
    item: "quran-badr-al-turki-hafs",
    // prettier-ignore
    seconds: [
      40, 7463, 4189, 4178, 3302, 3525, 3889, 1432, 3025, 2060, 2282, 2089, 937, 999, 792, 2020, 1810, 1699, 1099,
      1546, 1474, 1427, 1331, 1533, 996, 1449, 1345, 1630, 1092, 915, 564, 390, 1578, 905, 806, 861, 1103, 847, 1479,
      1512, 889, 976, 988, 397, 523, 725, 633, 634, 421, 480, 396, 382, 426, 395, 533, 468, 646, 503, 491, 411, 265,
      186, 202, 256, 325, 288, 338, 344, 317, 251, 250, 301, 216, 307, 205, 287, 236, 216, 220, 181, 130, 101, 205,
      115, 123, 70, 75, 104, 162, 88, 64, 91, 62, 38, 52, 93, 39, 107, 47, 68, 52, 46, 18, 45, 33, 29, 41, 16, 30,
      29, 30, 17, 26, 35,
    ],
    source: mp3quran("ar/bader"),
  },
];

export function getReciter(id: string) {
  return reciters.find((r) => r.id === id);
}

export function surahAudioUrl(reciter: Reciter, n: number) {
  return `https://archive.org/download/${reciter.item}/${String(n).padStart(3, "0")}.mp3`;
}
