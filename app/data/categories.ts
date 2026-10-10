// Top-level sections of the site, shown in the sidebar. Each lists its pages: the sciences of the
// curriculum ("Seeking Knowledge"), collections of adhkār, or Qur'an reciters. More categories can be added here.

import { href } from "react-router";
import { getAdhkarCollection } from "./adhkar";
import { getSubject, type Localized, subjects } from "./curriculum";
import { getReciter, reciters } from "./reciters";

export type CategoryItem =
  | { kind: "subject"; id: string }
  | { kind: "adhkar"; id: string }
  | { kind: "reciter"; id: string };

export type Category = {
  id: string;
  name: Localized;
  /** Shorter label for the mobile tab bar, where six items share the width. */
  shortName?: Localized;
  description: Localized;
  items: CategoryItem[];
};

const L = (ar: string, en: string, fr?: string): Localized => ({ ar, en, fr });

export const categories: Category[] = [
  {
    id: "talab-al-ilm",
    name: L("طلب العلم", "Seeking Knowledge", "Quête du savoir"),
    shortName: L("طلب العلم", "Knowledge", "Savoir"),
    description: L(
      "العلوم الشرعية وكتبها مرتّبة على المستويات، مع شروح العلماء المسجّلة.",
      "The Islamic sciences and their books, arranged by level, with scholars' recorded explanations.",
      "Les sciences islamiques et leurs livres, classés par niveau, avec les explications enregistrées des savants.",
    ),
    items: subjects.map((s) => ({ kind: "subject", id: s.id })),
  },
  {
    id: "adhkar",
    name: L("الأذكار", "Adhkār", "Adhkār"),
    description: L(
      "أذكار الصباح والمساء من الكتاب والسنة، مع عدّاد لكل ذكر.",
      "The morning and evening remembrance from the Qur'an and Sunnah, with a counter for each dhikr.",
      "Les invocations du matin et du soir tirées du Coran et de la Sunna, avec un compteur pour chacune.",
    ),
    items: [
      { kind: "adhkar", id: "sabah" },
      { kind: "adhkar", id: "masaa" },
    ],
  },
  {
    id: "quran",
    name: L("القرآن الكريم", "Qur'ān", "Coran"),
    shortName: L("القرآن", "Qur'ān", "Coran"),
    description: L(
      "تلاوات المصحف كاملاً بأصوات القرّاء، سورةً سورة.",
      "Complete recitations of the Qur'ān by its reciters, surah by surah.",
      "Des récitations complètes du Coran par ses récitateurs, sourate par sourate.",
    ),
    items: reciters.map((r) => ({ kind: "reciter", id: r.id })),
  },
];

export const DEFAULT_CATEGORY = categories[0].id;

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

/** The category a science, adhkār collection or reciter belongs to. */
export function categoryOf(kind: CategoryItem["kind"], id: string) {
  return categories.find((c) => c.items.some((i) => i.kind === kind && i.id === id));
}

/** Name, link and colour of a category's page, whatever its kind. */
export function itemInfo(item: CategoryItem): { name: Localized; to: string; hue: number } {
  if (item.kind === "subject") {
    const s = getSubject(item.id)!;
    return { name: s.name, to: href("/subjects/:subjectId", { subjectId: s.id }), hue: s.hue };
  }
  if (item.kind === "reciter") {
    const r = getReciter(item.id)!;
    return { name: r.name, to: href("/reciters/:reciterId", { reciterId: r.id }), hue: r.hue };
  }
  const c = getAdhkarCollection(item.id)!;
  return { name: c.name, to: href("/adhkar/:collectionId", { collectionId: c.id }), hue: c.hue };
}
