// The matn (text) of a book as a PDF, shown beside its lessons so the listener can follow along.
// The reader loads the copy in public/books/ (archive.org doesn't send CORS headers for PDFs, so
// PDF.js can't fetch it from there); the same file is mirrored on archive.org for opening/downloading.

import type { Localized } from "./curriculum";

export type BookText = {
  /** Same-origin copy the in-page reader loads. */
  src: string;
  /** Public mirror on archive.org, linked as "Open the PDF". */
  url: string;
  pages: number;
  /** Which printing of the text this is. */
  edition: Localized;
  /** Where the PDF comes from, credited under the reader. */
  source: { name: Localized; url: string };
};

const archive = (item: string, file: string) => `https://archive.org/download/${item}/${file}`;
const islamHouse = (id: number) => ({
  name: { ar: "دار الإسلام (IslamHouse)", en: "IslamHouse" },
  url: `https://islamhouse.com/ar/books/${id}/`,
});
const mutunTalibAlIlm: Localized = {
  ar: "طبعة «متون طالب العلم» للشيخ عبد المحسن القاسم",
  en: "Mutūn Ṭālib al-ʿIlm edition (Shaykh ʿAbd al-Muḥsin al-Qāsim)",
  fr: "Édition Mutūn Ṭālib al-ʿIlm (Shaykh ʿAbd al-Muḥsin al-Qāsim)",
};

const bookTexts: Record<string, BookText> = {
  "usul-thalatha": {
    src: "/books/thalathat-al-usul.pdf",
    url: archive("matn-thalathat-al-usul-qasim", "thalathat-al-usul.pdf"),
    pages: 34,
    edition: mutunTalibAlIlm,
    source: islamHouse(2388),
  },
  "qawaid-arbaa": {
    src: "/books/al-qawaid-al-arbaa.pdf",
    url: archive("matn-al-qawaid-al-arbaa-qasim", "al-qawaid-al-arbaa.pdf"),
    pages: 11,
    edition: mutunTalibAlIlm,
    source: islamHouse(497019),
  },
  "usul-sittah": {
    src: "/books/al-usul-al-sittah.pdf",
    url: archive("matn-al-usul-al-sittah", "al-usul-al-sittah.pdf"),
    pages: 3,
    edition: { ar: "متن الأصول الستة", en: "The matn of al-Uṣūl al-Sittah", fr: "Le matn d'al-Uṣūl al-Sittah" },
    source: islamHouse(2830535),
  },
  // The curriculum's «أركان الإيمان» for Ibn al-ʿUthaymīn: his treatise built on the six pillars.
  "arkan-iman-uthaymin": {
    src: "/books/nubdhah-fi-al-aqidah.pdf",
    url: archive("nubdhah-fi-al-aqidah-uthaymin", "nubdhah-fi-al-aqidah.pdf"),
    pages: 79,
    edition: {
      ar: "«نبذة في العقيدة الإسلامية (شرح أصول الإيمان)» — إصدار «رسالة الحرمين»",
      en: "«Nubdhah fī al-ʿAqīdah al-Islāmiyyah (Sharḥ Uṣūl al-Īmān)» — Risālat al-Ḥaramayn edition",
      fr: "«Nubdhah fī al-ʿAqīdah al-Islāmiyyah (Sharḥ Uṣūl al-Īmān)» — édition Risālat al-Ḥaramayn",
    },
    source: islamHouse(2842559),
  },
};

export function getBookText(bookId: string): BookText | undefined {
  return bookTexts[bookId];
}
