// The Qur'an's text in the riwayat the app offers (Qur'ān Tafsīr section), each in the King Fahd Complex's
// Uthmanic script for the Madinah mushaf (the text itself is in ./mushaf/<id>.md, read on the server).

import type { Localized } from "./curriculum";

export type MushafId = "hafs" | "warsh";

export type Mushaf = {
  id: MushafId;
  name: Localized;
  description: Localized;
  hue: number;
  /** Tailwind class of its KFGQPC font: the text only draws correctly in the font made for it. */
  font: string;
  /** Totals of the whole text, shown on its card (Warsh counts the ayat the Madinan way). */
  ayahs: number;
  pages: number;
};

const L = (ar: string, en: string, fr?: string): Localized => ({ ar, en, fr });

export const mushafs: Mushaf[] = [
  {
    id: "hafs",
    name: L("رواية حفص عن عاصم", "Ḥafṣ ʿan ʿĀṣim", "Ḥafṣ ʿan ʿĀṣim"),
    description: L(
      "الرواية الأكثر انتشاراً في العالم الإسلامي.",
      "The most widely read riwayah in the Muslim world.",
      "La riwāya la plus lue dans le monde musulman.",
    ),
    hue: 163,
    font: "font-hafs",
    ayahs: 6236,
    pages: 604,
  },
  {
    id: "warsh",
    name: L("رواية ورش عن نافع", "Warsh ʿan Nāfiʿ", "Warsh ʿan Nāfiʿ"),
    description: L(
      "رواية أهل المغرب العربي وغرب إفريقيا.",
      "The riwayah of the Maghreb and West Africa.",
      "La riwāya du Maghreb et de l'Afrique de l'Ouest.",
    ),
    hue: 30,
    font: "font-warsh",
    ayahs: 6214,
    pages: 604,
  },
];

export const mushafSource = {
  name: L("مجمع الملك فهد لطباعة المصحف الشريف", "King Fahd Glorious Qur'an Printing Complex", "Complexe du Roi Fahd pour l'impression du Saint Coran"),
  url: "https://qurancomplex.gov.sa/techquran/dev/",
};

/** Tafsirs offered for an ayah, read on tafsir.app (numbered by Ḥafṣ's count). */
export const tafsirs: { id: string; name: Localized }[] = [
  { id: "muyassar", name: L("التفسير الميسر", "Al-Muyassar", "Al-Muyassar") },
  { id: "saadi", name: L("تفسير السعدي", "As-Saʿdī", "As-Saʿdī") },
  { id: "ibn-katheer", name: L("تفسير ابن كثير", "Ibn Kathīr", "Ibn Kathīr") },
  { id: "tabari", name: L("تفسير الطبري", "Aṭ-Ṭabarī", "Aṭ-Ṭabarī") },
];

export const tafsirUrl = (tafsir: string, surah: number, ayah: number) =>
  `https://tafsir.app/${tafsir}/${surah}/${ayah}`;

/** Ibn Kathīr's abridged English translation on Quran.com, for readers without Arabic. */
export const englishTafsirUrl = (surah: number, ayah: number) =>
  `https://quran.com/${surah}:${ayah}/tafsirs/en-tafisr-ibn-kathir`;

export function getMushaf(id: string | undefined) {
  return mushafs.find((m) => m.id === id);
}
