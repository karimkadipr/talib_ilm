// Reads a tafsir kept in the app from ./tafsir/<id>.md (format described at the top of each file): the
// tafsir of each ayah, or of ayat explained together, numbered by Ḥafṣ's count.

import type { TafsirPart } from "./mushafs";
import { surahs as surahList } from "./surahs";

const files = import.meta.glob("./tafsir/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

/** Per surah, its parts and, per ayah, the part explaining it. */
type Surah = { parts: TafsirPart[]; partOf: TafsirPart[] };

const parsed = new Map<string, Surah[]>();

function parse(id: string): Surah[] {
  const raw = files[`./tafsir/${id}.md`];
  if (!raw) throw new Error(`No text for the ${id} tafsir`);
  const surahs: Surah[] = [];
  for (const line of raw.replace(/<!--[\s\S]*?-->/g, "").split("\n")) {
    const text = line.trim();
    if (!text) continue;
    let m: RegExpMatchArray | null;
    const surah = surahs.at(-1);
    if ((m = text.match(/^## (\d+) /))) {
      if (Number(m[1]) !== surahs.length + 1) throw new Error(`${id}.md: surah ${m[1]} out of order`);
      surahs.push({ parts: [], partOf: [] });
    } else if ((m = text.match(/^### (\d+)(?:-(\d+))?$/)) && surah) {
      const from = Number(m[1]);
      const to = Number(m[2] ?? m[1]);
      // A dropped or doubled part would put every later ayah's tafsir under the wrong ayah, so fail loudly.
      if (from !== surah.partOf.length + 1 || to < from) throw new Error(`${id}.md: surah ${surahs.length} ayat ${from}-${to} out of order`);
      const part = { from, to, text: "" };
      surah.parts.push(part);
      for (let n = from; n <= to; n++) surah.partOf.push(part);
    } else if (surah?.parts.length) {
      const part = surah.parts.at(-1)!;
      part.text += (part.text ? "\n" : "") + text;
    } else throw new Error(`${id}.md: unexpected line "${text.slice(0, 40)}"`);
  }
  for (const [i, s] of surahList.entries())
    if (surahs[i]?.partOf.length !== s.ayahs)
      throw new Error(`${id}.md: surah ${i + 1} explains ${surahs[i]?.partOf.length} ayat, not ${s.ayahs}`);
  return surahs;
}

/** The parts of a tafsir explaining these ayat of a surah (in Ḥafṣ's count), each once, in order. */
export function getTafsir(id: string, surah: number, ayahs: number[]): TafsirPart[] {
  let text = parsed.get(id);
  if (!text) parsed.set(id, (text = parse(id)));
  const partOf = text[surah - 1]?.partOf ?? [];
  return [...new Set(ayahs.map((n) => partOf[n - 1]).filter(Boolean))].sort((a, b) => a.from - b.from);
}
