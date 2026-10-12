// A book's matn typed out from its PDF, shown in the app's own reading style (the PDFs' text
// layers are unusable: custom font encodings, scans). One file per book in ./book-content/,
// named by book id, in a small markup:
//
//   [[3]]                  where page 3 of the PDF starts (own line, or inside a paragraph)
//   # Title                the book's title (title page)
//   ## Heading             a section; listed in the reader's contents
//   * Line                 a chapter opening inside a section (the book's ❊ lines); listed under it
//   ### Subheading
//   > Line                 a centred line (basmala, byline)
//   - Item                 a list item (consecutive items form one list)
//   Paragraph text         blank lines separate paragraphs
//   ﴿…﴾ [Surah: n]         a Qur'an quotation, with its reference
//   ﴿a * b﴾                consecutive verses in one quotation, separated as in print
//   «…»                    a ḥadīth or quoted saying (may contain Qur'an)
//   **…**                  the book's emphasis (its red key words)
//   ^1 … then [^1]: Note   a footnote marker in the text, and the note itself on its own line

import type { Block, BookContent, Inline } from "./book-content";

const files = import.meta.glob("./book-content/*.md", { query: "?raw", import: "default", eager: true }) as Record<
  string,
  string
>;

const INLINE = /﴿([^﴾]*)﴾(?:\s*\[([^\]]+)\])?|«([^»]*)»|\*\*([^*]+)\*\*|\[\[(\d+)\]\]|\^(\w+)/g;

function inlines(text: string, at: { page: number }): Inline[] {
  const out: Inline[] = [];
  let last = 0;
  const push = (v: string) => v && out.push({ t: "text", v });
  for (const m of text.matchAll(INLINE)) {
    push(text.slice(last, m.index));
    last = m.index + m[0].length;
    if (m[1] !== undefined) out.push({ t: "quran", v: m[1].trim(), ref: m[2]?.trim() });
    else if (m[3] !== undefined) out.push({ t: "quote", inlines: inlines(m[3], at) });
    else if (m[4] !== undefined) out.push({ t: "em", inlines: inlines(m[4], at) });
    else if (m[5] !== undefined) {
      at.page = Number(m[5]);
      out.push({ t: "page", n: at.page });
    } else out.push({ t: "note", n: m[6] });
  }
  push(text.slice(last));
  // Tidy the edges around a page break inside a paragraph.
  if (out[0]?.t === "text") out[0].v = out[0].v.trimStart();
  const end = out.at(-1);
  if (end?.t === "text") end.v = end.v.trimEnd();
  return out;
}

/** A chapter line's name in the contents: its emphasised opening, else its first words. */
function chapterName(text: string) {
  const lead = text.match(/\*\*([^*]+)\*\*/)?.[1] ?? text;
  const plain = lead
    .replace(/﴿[^﴾]*﴾|\[\[\d+\]\]|[«»]/g, "")
    .replace(/[:،؛.]\s*$/, "")
    .trim();
  const words = plain.split(/\s+/);
  return words.length > 9 ? `${words.slice(0, 8).join(" ")} …` : plain;
}

export function parseBookContent(source: string): BookContent {
  const blocks: Block[] = [];
  const at = { page: 1 };
  let list: Inline[][] | null = null;
  let section = 0;
  const text = source
    .replace(/\r\n/g, "\n")
    // A block's opening line starts a new chunk even without a blank line before it…
    .replace(/\n(?=#|> |\* |- |\[\^|\[\[\d+\]\][ \t]*(?:\n|$))/g, "\n\n")
    // …and a page marker on its own line ends its chunk.
    .replace(/^(\[\[\d+\]\])[ \t]*\n/gm, "$1\n\n");
  for (const raw of text.split(/\n\s*\n/)) {
    const chunk = raw.trim();
    if (!chunk) continue;
    if (!chunk.startsWith("- ")) list = null;
    const page = at.page;
    const pageOnly = chunk.match(/^\[\[(\d+)\]\]$/);
    if (pageOnly) {
      at.page = Number(pageOnly[1]);
      blocks.push({ type: "page", n: at.page });
    } else if (chunk.startsWith("### ")) {
      blocks.push({ type: "subheading", inlines: inlines(chunk.slice(4), at), page });
    } else if (chunk.startsWith("## ")) {
      const text = chunk.slice(3).trim();
      blocks.push({ type: "heading", id: `s${++section}`, text, inlines: inlines(text, at), page });
    } else if (chunk.startsWith("* ")) {
      const text = chunk.slice(2).replace(/\s*\n\s*/g, " ");
      blocks.push({ type: "chapter", id: `s${++section}`, text: chapterName(text), inlines: inlines(text, at), page });
    } else if (chunk.startsWith("# ")) {
      blocks.push({ type: "title", inlines: inlines(chunk.slice(2), at), page });
    } else if (chunk.startsWith("> ")) {
      blocks.push({ type: "center", inlines: inlines(chunk.slice(2), at), page });
    } else if (chunk.startsWith("- ")) {
      const item = inlines(chunk.slice(2), at);
      if (list) list.push(item);
      else blocks.push({ type: "list", items: (list = [item]), page });
    } else if (chunk.startsWith("[^")) {
      const m = chunk.match(/^\[\^(\w+)\]:\s*([\s\S]*)$/);
      if (m) blocks.push({ type: "footnote", n: m[1], inlines: inlines(m[2], at), page });
    } else {
      blocks.push({ type: "p", inlines: inlines(chunk.replace(/\s*\n\s*/g, " "), at), page });
    }
  }
  // Chapters sit under the heading before them; any before the first heading stand on their own.
  let underHeading = false;
  const sections = blocks.flatMap((b) => {
    if (b.type !== "heading" && b.type !== "chapter") return [];
    if (b.type === "heading") underHeading = true;
    return [{ id: b.id, text: b.text, page: b.page, level: b.type === "chapter" && underHeading ? (2 as const) : (1 as const) }];
  });
  return { blocks, sections, pages: at.page };
}

const cache = new Map<string, BookContent>();

/** The typed-out text of a book, if it has been done. */
export function getBookContent(bookId: string): BookContent | undefined {
  const source = files[`./book-content/${bookId}.md`];
  if (source === undefined) return undefined;
  let content = cache.get(bookId);
  if (!content) cache.set(bookId, (content = parseBookContent(source)));
  return content;
}
