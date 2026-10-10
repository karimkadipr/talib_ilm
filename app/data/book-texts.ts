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

const bookTexts: Record<string, BookText> = {
  "usul-thalatha": {
    src: "/books/thalathat-al-usul.pdf",
    url: archive("matn-thalathat-al-usul-qasim", "thalathat-al-usul.pdf"),
    pages: 34,
    edition: {
      ar: "طبعة «متون طالب العلم» للشيخ عبد المحسن القاسم",
      en: "Mutūn Ṭālib al-ʿIlm edition (Shaykh ʿAbd al-Muḥsin al-Qāsim)",
      fr: "Édition Mutūn Ṭālib al-ʿIlm (Shaykh ʿAbd al-Muḥsin al-Qāsim)",
    },
    source: { name: { ar: "دار الإسلام (IslamHouse)", en: "IslamHouse" }, url: "https://islamhouse.com/ar/books/2388/" },
  },
};

export function getBookText(bookId: string): BookText | undefined {
  return bookTexts[bookId];
}
