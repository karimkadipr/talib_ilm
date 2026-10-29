import type { Surah } from "~/data/surahs";

/** Arabic without diacritics and with one form of alif, tāʾ marbūṭah and yāʾ, so "الاعلى" finds "الأعلى". */
function plainArabic(s: string) {
  return s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function plainLatin(s: string) {
  return s
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

/** Whether a surah matches a search by number (Western or Arabic digits), Arabic name, transliteration or meaning. */
export function surahMatches(surah: Surah, query: string, meaning: string) {
  const q = query.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(surah.n).startsWith(q);
  const ar = plainArabic(q).replace(/^سوره\s*/, "");
  const latin = plainLatin(q);
  return (
    (ar.length > 0 && plainArabic(surah.name).includes(ar)) ||
    (latin.length > 0 && (plainLatin(surah.translit).includes(latin) || plainLatin(meaning).includes(latin)))
  );
}
