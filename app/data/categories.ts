// Top-level sections of the site, shown in the sidebar. Each lists its pages: the sciences of the
// curriculum ("Seeking Knowledge"), collections of adhkār, Qur'an reciters, or the Qur'an's text in
// each riwayah with its tafsir. More categories can be added here.

import { href } from "react-router";
import { getAdhkarCollection } from "./adhkar";
import { getSubject, type Localized, subjects } from "./curriculum";
import { getMushaf, mushafs } from "./mushafs";
import { getReciter, reciters } from "./reciters";

export type CategoryItem =
  | { kind: "subject"; id: string }
  | { kind: "adhkar"; id: string }
  | { kind: "reciter"; id: string }
  | { kind: "mushaf"; id: string };

export type Category = {
  id: string;
  name: Localized;
  /** Shorter label for the mobile tab bar, where six items share the width. */
  shortName?: Localized;
  description: Localized;
  /** Accent of its card on the home page. */
  hue: number;
  items: CategoryItem[];
  /** List only the category in the sidebar, not its pages (it stays highlighted while one is open). */
  hideItemsInSidebar?: boolean;
};

const L = (ar: string, en: string, fr?: string): Localized => ({ ar, en, fr });

export const categories: Category[] = [
  {
    id: "talab-al-ilm",
    name: L("طلب العلم", "Seeking Knowledge", "Quête du savoir"),
    shortName: L("طلب العلم", "Knowledge", "Savoir"),
    hue: 163,
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
    hue: 75,
    description: L(
      "أذكار الصباح والمساء من الكتاب والسنة، مع عدّاد لكل ذكر.",
      "The morning and evening remembrance from the Qur'ān and Sunnah, with a counter for each dhikr.",
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
    hue: 190,
    description: L(
      "تلاوات المصحف كاملاً بأصوات القرّاء، سورةً سورة.",
      "Complete recitations of the Qur'ān by its reciters, surah by surah.",
      "Des récitations complètes du Coran par ses récitateurs, sourate par sourate.",
    ),
    items: reciters.map((r) => ({ kind: "reciter", id: r.id })),
  },
  {
    id: "tafsir",
    name: L("تفسير القرآن", "Qur'ān Tafsīr", "Tafsīr du Coran"),
    shortName: L("التفسير", "Tafsīr", "Tafsīr"),
    hue: 280,
    description: L(
      "المصحف كاملاً بروايتي حفص وورش برسم مصحف المدينة النبوية، وتفسير كل آية بلمسة.",
      "The full muṣḥaf in the riwayat of Ḥafṣ and Warsh, as written in the Madinah muṣḥaf: tap any ayah for its tafsīr.",
      "Le muṣḥaf complet selon les riwāyat de Ḥafṣ et de Warsh, tel qu'écrit dans le muṣḥaf de Médine : touchez un verset pour son tafsīr.",
    ),
    items: mushafs.map((m) => ({ kind: "mushaf", id: m.id })),
    hideItemsInSidebar: true,
  },
];

export const DEFAULT_CATEGORY = categories[0].id;

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

/** The category a science, adhkār collection, reciter or mushaf belongs to. */
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
  if (item.kind === "mushaf") {
    const m = getMushaf(item.id)!;
    return { name: m.name, to: href("/mushaf/:mushafId", { mushafId: m.id }), hue: m.hue };
  }
  const c = getAdhkarCollection(item.id)!;
  return { name: c.name, to: href("/adhkar/:collectionId", { collectionId: c.id }), hue: c.hue };
}
