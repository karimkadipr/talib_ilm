// Shapes of a book's typed-out text (parsed on the server by book-content.server.ts).

export type Inline =
  | { t: "text"; v: string }
  | { t: "quran"; v: string; ref?: string }
  | { t: "quote"; inlines: Inline[] }
  | { t: "em"; inlines: Inline[] }
  | { t: "page"; n: number }
  | { t: "note"; n: string };

export type Block =
  | { type: "title" | "subheading" | "center" | "p"; inlines: Inline[]; page: number }
  | { type: "heading" | "chapter"; inlines: Inline[]; page: number; id: string; text: string }
  | { type: "list"; items: Inline[][]; page: number }
  | { type: "page"; n: number }
  | { type: "footnote"; n: string; inlines: Inline[]; page: number };

export type BookContent = {
  blocks: Block[];
  /** Sections for the contents menu. */
  /** Level 1: a section heading; level 2: a chapter line inside it. */
  sections: { id: string; text: string; page: number; level: 1 | 2 }[];
  pages: number;
};
