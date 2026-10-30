// Reads a riwayah's text from ./mushaf/<id>.md (format described at the top of each file): surahs,
// their basmala, and one ayah per line with where its juz and Madinah-mushaf page start.

import type { MushafId } from "./mushafs";

const files = import.meta.glob("./mushaf/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

export type Ayah = {
  n: number;
  /** The published text, ending in its number (drawn as the ayah mark by the font); see forUthmaniFont. */
  text: string;
  page: number;
  juz: number;
  /**
   * The same ayah in Ḥafṣ's (Kufan) count, which tafsir sites number by. Warsh counts the Madinan
   * way, so e.g. its al-Baqarah 254 is Ḥafṣ's 255 (Āyat al-Kursī).
   */
  hafs: number;
  /**
   * Every Ḥafṣ ayah it holds, for its tafsir: usually just `hafs`, but e.g. Warsh's al-Baqarah 1
   * holds Ḥafṣ's 1 (الٓمٓ) and 2.
   */
  hafsAyahs: number[];
};

export type MushafSurah = { n: number; name: string; basmala: string | null; ayahs: Ayah[] };

const ARABIC_DIGITS = /[٠-٩]+$/;
const parsed = new Map<MushafId, MushafSurah[]>();

/**
 * Both riwayat are drawn in the Uthmanic Hafs font (the Madinah mushaf's familiar look). It has every
 * mark Warsh uses except two characters, given here their Uthmani form: the returned yāʾ (ے, ۓ with
 * hamza), which naskh writes as the undotted final yāʾ (ى, ئ), and the mark on a connecting alif read
 * with ḍamma (U+06DF), written with the connecting-alif mark the rest of the text uses (U+06EC).
 * The .md file keeps the published text.
 */
const forUthmaniFont = (text: string) =>
  text.replace(/ۓ/g, "ئ").replace(/ے/g, "ى").replace(/۟/g, "۬");

function parse(id: MushafId): MushafSurah[] {
  const raw = files[`./mushaf/${id}.md`];
  if (!raw) throw new Error(`No text for the ${id} mushaf`);
  const surahs: MushafSurah[] = [];
  let page = 0;
  let juz = 0;
  for (const line of raw.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    const text = forUthmaniFont(line.trim());
    if (!text) continue;
    let m: RegExpMatchArray | null;
    if ((m = text.match(/^## (\d+) (.+)$/))) surahs.push({ n: Number(m[1]), name: m[2], basmala: null, ayahs: [] });
    else if (text.startsWith("> ")) surahs.at(-1)!.basmala = text.slice(2);
    else if ((m = text.match(/^\{\{(\d+)\}\}$/))) juz = Number(m[1]);
    else if ((m = text.match(/^\[\[(\d+)\]\]$/))) page = Number(m[1]);
    else {
      const surah = surahs.at(-1)!;
      const n = surah.ayahs.length + 1;
      const digits = text.match(ARABIC_DIGITS)?.[0];
      const numbered = digits && [...digits].reduce((v, d) => v * 10 + d.charCodeAt(0) - 0x660, 0);
      // A dropped or merged line would shift every later ayah, so fail loudly instead.
      if (numbered !== n) throw new Error(`${id}.md: surah ${surah.n} ayah ${n} reads as ${numbered}`);
      surah.ayahs.push({ n, text, page, juz, hafs: n, hafsAyahs: [n] });
    }
  }
  return surahs;
}

/** Words of an ayah, without its number or standalone marks (۞, pause signs). */
function wordCount(text: string) {
  return text
    .replace(/ ?[٠-٩]+$/, "")
    .split(/[\s ]+/)
    .filter((w) => /[ء-يٱ]/.test(w)).length;
}

/**
 * Gives each ayah of another riwayah its number in Ḥafṣ's count: the Ḥafṣ ayah holding most of its
 * words, counting words from the start of the surah. The two texts have the same words in 106 surahs
 * and differ by one word in the rest, so this lands on the right ayah. It also holds every Ḥafṣ ayah
 * it shares two words with, or all of one (الٓمٓ is a single word); a single shared word may be just
 * that one-word difference.
 */
function numberByHafs(surahs: MushafSurah[], hafs: MushafSurah[]) {
  for (const [i, surah] of surahs.entries()) {
    const ends: number[] = [];
    const sizes: number[] = [];
    let total = 0;
    for (const a of hafs[i].ayahs) {
      sizes.push(wordCount(a.text));
      ends.push((total += sizes.at(-1)!));
    }
    // Ḥafṣ numbers al-Fātiḥah's basmala as its first ayah; the others leave it unnumbered.
    let start = i === 0 ? ends[0] : 0;
    for (const a of surah.ayahs) {
      const count = wordCount(a.text);
      const votes = new Map<number, number>();
      for (let w = start; w < start + count; w++) {
        const j = ends.findIndex((end) => w < end);
        votes.set(j, (votes.get(j) ?? 0) + 1);
      }
      a.hafs = [...votes].sort((x, y) => y[1] - x[1] || x[0] - y[0])[0][0] + 1;
      a.hafsAyahs = [...votes]
        .filter(([j, n]) => j + 1 === a.hafs || n >= 2 || n === sizes[j])
        .map(([j]) => j + 1)
        .sort((x, y) => x - y);
      start += count;
    }
  }
}

export function getMushafText(id: MushafId) {
  let surahs = parsed.get(id);
  if (!surahs) {
    surahs = parse(id);
    if (id !== "hafs") numberByHafs(surahs, getMushafText("hafs"));
    parsed.set(id, surahs);
  }
  return surahs;
}

/**
 * The ayat of one surah on a page: `opens` when the surah begins on it (heading and basmala shown),
 * `closes` when it ends on it.
 */
export type PageSection = { surah: number; opens: boolean; closes: boolean; basmala: string | null; ayahs: Ayah[] };

const paged = new Map<MushafId, PageSection[][]>();

/** Every page of the Madinah mushaf in this riwayah (page 1 first), as its surahs' sections. */
function pagesOf(id: MushafId) {
  let pages = paged.get(id);
  if (pages) return pages;
  pages = [];
  for (const s of getMushafText(id)) {
    for (const a of s.ayahs) {
      const page = (pages[a.page - 1] ??= []);
      if (page.at(-1)?.surah !== s.n)
        page.push({ surah: s.n, opens: a.n === 1, closes: false, basmala: a.n === 1 ? s.basmala : null, ayahs: [] });
      const section = page.at(-1)!;
      section.ayahs.push(a);
      section.closes = a.n === s.ayahs.length;
    }
  }
  paged.set(id, pages);
  return pages;
}

export function pageCount(id: MushafId) {
  return pagesOf(id).length;
}

/** One page's text, or undefined past the last page. */
export function getPage(id: MushafId, n: number): PageSection[] | undefined {
  return pagesOf(id)[n - 1];
}

// The page as printed, line by line (./mushaf/<id>.lines.txt, made from the KFGQPC data: each page's
// rows, a surah heading, a basmala, or a number of words read on through the text). Ḥafṣ breaks its
// lines exactly where the Madinah mushaf does; Warsh starts and ends each ayah on its printed lines,
// with the breaks inside an ayah chosen to make the lines even.
const layouts = import.meta.glob("./mushaf/*.lines.txt", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

/** An ayah's words (its number left out), as its lines split them. */
export function ayahWords(text: string) {
  const [, words] = text.match(/^([\s\S]*?)( ?[٠-٩]+)$/) ?? [text, text];
  return words.trim().split(/[\s ]+/);
}

/** Some words of one ayah on a line; `end` when they're its last (its number follows). */
export type LinePart = { surah: number; n: number; words: string; end: boolean };

/** A row of a printed page: a surah's heading, its basmala, or a line of text. */
export type PageRow = { kind: "surah"; surah: number } | { kind: "basmala"; text: string } | { kind: "line"; parts: LinePart[] };

const lined = new Map<MushafId, PageRow[][]>();

function linesOf(id: MushafId) {
  let pages = lined.get(id);
  if (pages) return pages;
  const raw = layouts[`./mushaf/${id}.lines.txt`];
  if (!raw) throw new Error(`No line layout for the ${id} mushaf`);
  const text = getMushafText(id);
  // A cursor through every word of the text: surah, ayah, word.
  let s = 0;
  let a = 0;
  let w = 0;
  const words = new Map<Ayah, string[]>();
  pages = raw
    .split("\n")
    .filter((l) => l.trim() && !l.startsWith("#"))
    .map((l) => {
      let heading = 0;
      return l.trim().split(" ").map((row): PageRow => {
        if (row.startsWith("h")) return { kind: "surah", surah: (heading = Number(row.slice(1))) };
        if (row === "b") return { kind: "basmala", text: text[heading - 1].basmala ?? "" };
        const parts: LinePart[] = [];
        for (let left = Number(row); left > 0; ) {
          const surah = text[s];
          const ayah = surah.ayahs[a];
          const all = words.get(ayah) ?? words.set(ayah, ayahWords(ayah.text)).get(ayah)!;
          const take = Math.min(left, all.length - w);
          parts.push({ surah: surah.n, n: ayah.n, words: all.slice(w, w + take).join(" "), end: w + take === all.length });
          left -= take;
          w += take;
          if (w === all.length) {
            w = 0;
            if (++a === surah.ayahs.length) {
              a = 0;
              s++;
            }
          }
        }
        return { kind: "line", parts };
      });
    });
  // Every word laid out once: a layout out of step with the text would misplace all that follows.
  if (s !== text.length) throw new Error(`${id}.lines.txt doesn't cover the text (stopped in surah ${s + 1})`);
  lined.set(id, pages);
  return pages;
}

/** One page's rows, top to bottom, or undefined past the last page. */
export function getPageLines(id: MushafId, n: number): PageRow[] | undefined {
  return linesOf(id)[n - 1];
}

/** An ayah of a riwayah by its surah and number. */
export function getAyah(id: MushafId, surah: number, n: number): Ayah | undefined {
  return getMushafText(id)[surah - 1]?.ayahs[n - 1];
}
