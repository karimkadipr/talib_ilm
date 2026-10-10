// Collections of adhkār (daily remembrance). Only names and display info live here; the texts
// are loaded on the server by adhkar.server.ts so they don't ship in every page's bundle.

import type { Localized } from "./curriculum";

export type Dhikr = {
  /** Opening line said before the dhikr, e.g. the istiʿādhah before Āyat al-Kursī. */
  intro: string | null;
  text: string;
  /** Its virtue (faḍl), when the source gives one. */
  virtue: string | null;
  /** How many times to say it. */
  count: number;
};

export type AdhkarCollection = {
  id: "sabah" | "masaa";
  name: Localized;
  hue: number;
  icon: "sun" | "moon";
  /** Where the texts were taken from, credited on the page. */
  source: { name: Localized; url: string };
};

export const adhkarCollections: AdhkarCollection[] = [
  {
    id: "sabah",
    name: { ar: "أذكار الصباح", en: "Morning adhkār", fr: "Adhkār du matin" },
    hue: 75,
    icon: "sun",
    source: { name: { ar: "إسلام بوك", en: "IslamBook" }, url: "https://www.islambook.com/azkar/1/أذكار-الصباح" },
  },
  {
    id: "masaa",
    name: { ar: "أذكار المساء", en: "Evening adhkār", fr: "Adhkār du soir" },
    hue: 265,
    icon: "moon",
    source: { name: { ar: "إسلام بوك", en: "IslamBook" }, url: "https://www.islambook.com/azkar/2/أذكار-المساء" },
  },
];

export function getAdhkarCollection(id: string) {
  return adhkarCollections.find((c) => c.id === id);
}
