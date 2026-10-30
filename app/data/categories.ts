// Sections of the site, shown in the sidebar. Each lists its pages: the sciences of the curriculum
// ("Seeking Knowledge"), collections of adhkār, Qur'an reciters, or the Qur'an's text in each riwayah
// with its tafsir. A section can also hold sub-sections (the Qur'an: its recitations and its tafsir),
// which are listed under it rather than at the top level. More categories can be added here.

import { href } from "react-router";
import { getAdhkarCollection } from "./adhkar";
import { getSubject, type Localized, subjects } from "./curriculum";
import { getMushaf, mushafs } from "./mushafs";
import { getReciter, reciters } from "./reciters";

export type CategoryItem =
  | { kind: "subject"; id: string }
  | { kind: "adhkar"; id: string }
  | { kind: "reciter"; id: string }
  | { kind: "mushaf"; id: string }
  | { kind: "category"; id: string };

export type Category = {
  id: string;
  name: Localized;
  /** Shorter label for the mobile tab bar, where six items share the width. */
  shortName?: Localized;
  description: Localized;
  /** Accent of its card on the home page. */
  hue: number;
  items: CategoryItem[];
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
      "تلاوات المصحف كاملاً بأصوات القرّاء، والمصحف بروايتي حفص وورش مع تفسير كل آية.",
      "Complete recitations of the Qur'ān by its reciters, and the muṣḥaf in the riwayat of Ḥafṣ and Warsh with the tafsīr of every ayah.",
      "Des récitations complètes du Coran par ses récitateurs, et le muṣḥaf selon les riwāyat de Ḥafṣ et de Warsh avec le tafsīr de chaque verset.",
    ),
    items: [
      { kind: "category", id: "recitation" },
      { kind: "category", id: "tafsir" },
    ],
  },
  {
    id: "recitation",
    name: L("التلاوة", "Recitation", "Récitation"),
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
    name: L("التفسير", "Tafsīr", "Tafsīr"),
    hue: 280,
    description: L(
      "المصحف كاملاً بروايتي حفص وورش برسم مصحف المدينة النبوية، وتفسير كل آية بلمسة.",
      "The full muṣḥaf in the riwayat of Ḥafṣ and Warsh, as written in the Madinah muṣḥaf: tap any ayah for its tafsīr.",
      "Le muṣḥaf complet selon les riwāyat de Ḥafṣ et de Warsh, tel qu'écrit dans le muṣḥaf de Médine : touchez un verset pour son tafsīr.",
    ),
    items: mushafs.map((m) => ({ kind: "mushaf", id: m.id })),
  },
];

export const DEFAULT_CATEGORY = categories[0].id;

export function getCategory(id: string) {
  return categories.find((c) => c.id === id);
}

/** The category a science, adhkār collection, reciter, mushaf or sub-section belongs to. */
export function categoryOf(kind: CategoryItem["kind"], id: string) {
  return categories.find((c) => c.items.some((i) => i.kind === kind && i.id === id));
}

/** The sections at the top of the sidebar, tab bar and home page (the others sit inside one). */
export const topCategories = categories.filter((c) => !categoryOf("category", c.id));

/** Whether a path is a section's own page or one of its pages, its sub-sections' included. */
export function categoryContains(category: Category, pathname: string): boolean {
  if (pathname === itemInfo({ kind: "category", id: category.id }).to) return true;
  return category.items.some((i) =>
    i.kind === "category" ? categoryContains(getCategory(i.id)!, pathname) : pathname.startsWith(itemInfo(i).to),
  );
}

/** Name, link and colour of a category's page, whatever its kind. */
export function itemInfo(item: CategoryItem): { name: Localized; to: string; hue: number } {
  if (item.kind === "category") {
    const c = getCategory(item.id)!;
    return { name: c.name, to: href("/categories/:categoryId", { categoryId: c.id }), hue: c.hue };
  }
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
