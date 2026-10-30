import { type Category, getCategory } from "~/data/categories";
import { countBooks, getSubject } from "~/data/curriculum";
import { useLocalize } from "~/lib/localize";

type T = ReturnType<typeof useLocalize>["t"];

function stats(category: Category, t: T): string[] {
  const kinds = new Set(category.items.map((i) => i.kind));
  const n = category.items.length;
  if (kinds.size !== 1) return [];
  if (kinds.has("category")) return category.items.flatMap((i) => stats(getCategory(i.id)!, t));
  if (kinds.has("subject")) {
    const books = category.items.reduce((sum, i) => sum + countBooks(getSubject(i.id)!), 0);
    return [t("home.sciences", { count: n }), t("program.books", { count: books })];
  }
  if (kinds.has("reciter")) return [t("home.reciters", { count: n })];
  if (kinds.has("mushaf")) return [t("home.riwayat", { count: n })];
  // The reader's own progress, not something the section holds.
  if (kinds.has("hifz")) return [];
  return [t("home.collections", { count: n })];
}

/**
 * What a category holds, e.g. "10 sciences · 154 books"; for a section of sub-sections, what they
 * hold ("4 reciters · 2 riwayat").
 */
export function useCategoryStats(category: Category) {
  const { t } = useLocalize();
  return stats(category, t);
}
