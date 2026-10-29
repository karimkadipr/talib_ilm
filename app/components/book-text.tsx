import { cn } from "cn";
import { AArrowDown, AArrowUp, Bookmark, BookmarkPlus, Check, ListTree } from "lucide-react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Block, BookContent, Inline } from "~/data/book-content";
import { useTextNotes } from "~/components/text-notes";
import { type Bookmark as Mark, bookmarks, useBookmark } from "~/lib/book-bookmark";
import { useLocalize } from "~/lib/localize";
import { blockOf, caretAt, domPoint, offsetIn } from "~/lib/text-points";

const SIZES = ["1.125rem", "1.25rem", "1.375rem", "1.5rem", "1.75rem"];
const SIZE_KEY = "islamic-studies:reader:size";
const SPOT_KEY = (bookId: string) => `islamic-studies:reader:spot:${bookId}`;

function readSize() {
  try {
    const i = Number(localStorage.getItem(SIZE_KEY));
    return Number.isInteger(i) && i >= 0 && i < SIZES.length ? i : 1;
  } catch {
    return 1;
  }
}

/** Where the listener was in the text: the scroll offset, and the PDF page it was on then. */
function readSpot(bookId: string): { top: number; page: number } | null {
  try {
    return JSON.parse(localStorage.getItem(SPOT_KEY(bookId)) ?? "null");
  } catch {
    return null;
  }
}

/**
 * Scrolls only the text's own box so `target` sits at its top. (scrollIntoView would also scroll the
 * page itself, pulling the player out of view.)
 */
function scrollBoxTo(box: HTMLElement, target: HTMLElement | null, behavior: ScrollBehavior) {
  if (!target) return;
  const top = target.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop - 16;
  box.scrollTo({ top, behavior });
}

/** A line of the text, in the article's coordinates (for the hover band, the ribbon and the glow). */
type Line = { top: number; height: number };

function lineHeightOf(el: HTMLElement) {
  const s = getComputedStyle(el);
  const n = parseFloat(s.lineHeight);
  return s.lineHeight.endsWith("px") ? n : (Number.isFinite(n) ? n : 1.6) * parseFloat(s.fontSize);
}

/** The line through the character at (node, offset) of `block`. */
function lineThrough(article: HTMLElement, block: HTMLElement, node: Node, offset: number): Line {
  const r = document.createRange();
  const len = node.nodeType === Node.TEXT_NODE ? (node.textContent?.length ?? 0) : 0;
  if (offset < len) {
    r.setStart(node, offset);
    r.setEnd(node, offset + 1);
  } else if (len > 0) {
    r.setStart(node, len - 1);
    r.setEnd(node, len);
  } else r.selectNodeContents(block);
  const rect = [...r.getClientRects()].find((x) => x.height > 0) ?? block.getBoundingClientRect();
  const height = lineHeightOf(block);
  return { top: rect.top + rect.height / 2 - height / 2 - article.getBoundingClientRect().top, height };
}

/** The line under a point on screen, and the character there that will anchor a bookmark. */
function lineAt(article: HTMLElement, x: number, y: number): (Line & { b: number; o: number }) | null {
  const at = caretAt(x, y);
  const block = at && blockOf(at[0]);
  if (!at || !block || !article.contains(block)) return null;
  return { b: Number(block.dataset.block), o: offsetIn(block, ...at), ...lineThrough(article, block, ...at) };
}

/** The bookmarked line. */
function lineOf(article: HTMLElement, mark: Pick<Mark, "b" | "o">): Line | null {
  const at = domPoint(article, { b: mark.b, o: mark.o ?? 0 });
  const block = article.querySelector<HTMLElement>(`[data-block="${mark.b}"]`);
  return at && block ? lineThrough(article, block, ...at) : null;
}

/** The words at a character of a block: from the start of its word, about a line's worth. */
function wordsAt(block: HTMLElement, o: number) {
  const text = block.textContent ?? "";
  let start = Math.min(o, text.length);
  while (start > 0 && !/\s/.test(text[start - 1])) start--;
  return text.slice(start, start + 100).replace(/\s+/g, " ").trim();
}

/** The ribbon in the margin beside a line: the bookmark, or a preview of where it would go. */
function Ribbon({ line, ghost = false, drop = false }: { line: Line; ghost?: boolean; drop?: boolean }) {
  return (
    <span
      aria-hidden
      className={cn(
        "tint-solid pointer-events-none absolute h-[1.05rem] w-3 [clip-path:polygon(0_0,100%_0,100%_100%,50%_72%,0_100%)]",
        ghost && "opacity-45",
        drop && "animate-ribbon-drop motion-reduce:animate-none",
      )}
      style={{ top: line.top + line.height / 2 - 9, insetInlineStart: "-1.2rem" }}
    />
  );
}

/**
 * The book's matn typed out from its PDF and set in the app's own style: one scrolling column of
 * Arabic text with its sections, Qur'an quotations and the PDF's page numbers, so it's easy to
 * follow while a lesson plays. Reports the PDF page in view so the PDF view can open on it.
 */
export function BookText({
  bookId,
  content,
  page,
  onPage,
  fill = false,
  landing = false,
}: {
  bookId: string;
  content: BookContent;
  /** The PDF page to open on (e.g. the one the PDF view was showing). */
  page: number;
  onPage: (page: number) => void;
  /** Fill the window's height (beside the player) rather than a box within the page. */
  fill?: boolean;
  /** The listener has just come to the page: open at the bookmark, if there is one. */
  landing?: boolean;
}) {
  const { t, num, isAr } = useLocalize();
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const [size, setSize] = useState(1);
  const [current, setCurrent] = useState({ page, section: "" });
  const mark = useBookmark(bookId);
  // Bookmarking: after the bookmark button, the next tap on a line bookmarks it (hover previews it).
  const [placing, setPlacing] = useState(false);
  const [hover, setHover] = useState<Line | null>(null);
  const [ribbon, setRibbon] = useState<Line | null>(null);
  // A line lit up for a moment (just bookmarked, or jumped to); the key restarts its animation.
  const [flash, setFlash] = useState<(Line & { key: number }) | null>(null);
  // "Bookmarked · page n", with the bookmark it replaced so Undo can put it back.
  const [placed, setPlaced] = useState<{ page: number; prev: Mark | null } | null>(null);
  // Latest callback without re-subscribing the scroll listener on every render.
  const report = useRef(onPage);
  report.current = onPage;

  useEffect(() => setSize(readSize()), []);
  const notes = useTextNotes({ bookId, content, wrap, box, article, layoutKey: size });

  // Open at the bookmark when arriving, else where the listener left off, or at the page the PDF
  // view was on.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const spot = readSpot(bookId);
    const saved = landing ? bookmarks.get(bookId) : null;
    if (!saved) {
      if (spot && spot.page === page) el.scrollTop = spot.top;
      else scrollBoxTo(el, el.querySelector<HTMLElement>(`[data-page-start="${page}"]`), "auto");
      return;
    }
    // Keep the bookmarked line near the top while the text settles (the page's layout, the fonts),
    // until the listener takes over.
    const hold = () => scrollToLine(saved, "auto");
    hold();
    // Show the listener where they've landed.
    const lit = setTimeout(() => lightUp(saved), 400);
    const observer = new ResizeObserver(hold);
    if (article.current) observer.observe(article.current);
    const inputs = ["wheel", "touchstart", "pointerdown", "keydown"] as const;
    const release = () => {
      observer.disconnect();
      clearTimeout(timer);
      for (const type of inputs) window.removeEventListener(type, release, true);
    };
    const timer = setTimeout(release, 4000);
    for (const type of inputs) window.addEventListener(type, release, { capture: true, passive: true });
    return () => {
      release();
      clearTimeout(lit);
    };
    // Only on opening; afterwards the scroll position leads.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookId]);

  // Follow the page and section in view, and remember the spot.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    let frame = 0;
    const onScroll = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const line = el.getBoundingClientRect().top + 48;
        let pageNow = 1;
        let section = "";
        for (const mark of el.querySelectorAll<HTMLElement>("[data-page-start], [data-section]")) {
          if (mark.getBoundingClientRect().top > line) break;
          if (mark.dataset.pageStart) pageNow = Number(mark.dataset.pageStart);
          if (mark.dataset.section) section = mark.dataset.section;
        }
        setCurrent((c) => (c.page === pageNow && c.section === section ? c : { page: pageNow, section }));
        report.current(pageNow);
        try {
          localStorage.setItem(SPOT_KEY(bookId), JSON.stringify({ top: Math.round(el.scrollTop), page: pageNow }));
        } catch {
          // Storage blocked: the text just opens at the top next time.
        }
      });
    };
    onScroll();
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      el.removeEventListener("scroll", onScroll);
    };
  }, [bookId]);

  function resize(by: number) {
    const next = Math.min(SIZES.length - 1, Math.max(0, size + by));
    setSize(next);
    try {
      localStorage.setItem(SIZE_KEY, String(next));
    } catch {}
  }

  /** Scrolls the text to the element matching `selector`, and returns it. */
  function jump(selector: string) {
    const el = box.current;
    const target = el?.querySelector<HTMLElement>(selector);
    if (!el || !target) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollBoxTo(el, target, reduce ? "auto" : "smooth");
    return target;
  }

  /** Scrolls the text so a bookmarked line sits a little below the top of the box. */
  function scrollToLine(at: Pick<Mark, "b" | "o">, behavior: ScrollBehavior) {
    const el = box.current;
    const art = article.current;
    const line = art && lineOf(art, at);
    if (!el || !art || !line) return;
    const offset = art.getBoundingClientRect().top - el.getBoundingClientRect().top + el.scrollTop;
    el.scrollTo({ top: offset + line.top - el.clientHeight * 0.2, behavior });
  }

  /** Lights a line up for a moment, so the listener sees where the bookmark is. */
  function lightUp(at: Pick<Mark, "b" | "o">) {
    const line = article.current && lineOf(article.current, at);
    if (line) setFlash({ ...line, key: Date.now() });
  }

  /** Bookmarks the line through character `o` of block `b` (moving the book's one bookmark there). */
  function place(b: number, o: number) {
    const block = article.current?.querySelector<HTMLElement>(`[data-block="${b}"]`);
    const data = content.blocks[b];
    if (!block || !data) return;
    const prev = bookmarks.get(bookId);
    const page = data.type !== "page" ? data.page : current.page;
    bookmarks.set(bookId, { b, o, page, quote: wordsAt(block, o) });
    setPlacing(false);
    setHover(null);
    setPlaced({ page, prev });
    lightUp({ b, o });
  }

  /** Bookmarking from the keyboard: the first line at the top of the view. */
  function placeAtTop() {
    const el = box.current;
    const art = article.current;
    if (!el || !art) return;
    const r = el.getBoundingClientRect();
    const blocks = [...art.querySelectorAll<HTMLElement>("[data-block]")];
    const first = blocks.find((b) => b.getBoundingClientRect().bottom > r.top + 24);
    if (first) place(Number(first.dataset.block), 0);
  }

  function goToBookmark() {
    if (!mark) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scrollToLine(mark, reduce ? "auto" : "smooth");
    lightUp(mark);
  }

  function undoPlace() {
    if (placed?.prev) bookmarks.set(bookId, placed.prev);
    else bookmarks.remove(bookId);
    setPlaced(null);
  }

  // The ribbon follows its line as the text reflows (size, width, fonts).
  const measureRibbon = useCallback(() => {
    const art = article.current;
    setRibbon(art && mark ? lineOf(art, mark) : null);
  }, [mark]);
  useLayoutEffect(() => {
    measureRibbon();
    const art = article.current;
    if (!art) return;
    const observer = new ResizeObserver(measureRibbon);
    observer.observe(art);
    document.fonts?.ready.then(measureRibbon);
    return () => observer.disconnect();
  }, [measureRibbon, size]);

  // While bookmarking: Escape cancels, Enter takes the line at the top (for the keyboard).
  useEffect(() => {
    if (!placing) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPlacing(false);
      else if (e.key === "Enter" && !(e.target as HTMLElement).closest("input, textarea, button, [role=menuitem]")) {
        e.preventDefault();
        placeAtTop();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });
  useEffect(() => {
    if (!placing) setHover(null);
  }, [placing]);

  // The confirmation goes after a few seconds (long enough to reach Undo).
  useEffect(() => {
    if (!placed) return;
    const id = setTimeout(() => setPlaced(null), 4500);
    return () => clearTimeout(id);
  }, [placed]);

  const sectionTitle = content.sections.find((s) => s.id === current.section)?.text;
  const tool =
    "flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40 disabled:hover:bg-transparent";

  return (
    <div ref={wrap} className="relative overflow-hidden rounded-2xl border bg-card">
      {/* Toolbar: contents, where you are, text size. */}
      <div className="flex items-center gap-2 border-b px-2 py-1.5">
        {content.sections.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger
              className="flex min-w-0 items-center gap-2 rounded-full px-2.5 py-1 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
              aria-label={t("reader.contents")}
            >
              <ListTree className="size-4 shrink-0" />
              {sectionTitle ? (
                <span lang="ar" dir="rtl" className="font-arabic truncate">
                  {sectionTitle}
                </span>
              ) : (
                <span className="truncate">{t("reader.contents")}</span>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="start"
              // Focus stays in the text (where the jump landed), not back on the button.
              onCloseAutoFocus={(e) => e.preventDefault()}
              className="max-h-80 w-80 max-w-[calc(100vw-2rem)] rounded-xl p-1.5"
            >
              {content.sections.map((s) => (
                <DropdownMenuItem
                  key={s.id}
                  onSelect={() => jump(`[data-section="${s.id}"]`)}
                  className={cn(
                    "justify-between gap-6 rounded-lg px-3 py-2",
                    s.level === 2 && "ps-7 text-muted-foreground",
                    s.id === current.section && "text-primary",
                  )}
                >
                  <span lang="ar" dir="rtl" className={cn("font-arabic line-clamp-2", s.level === 1 ? "text-base font-medium" : "text-sm")}>
                    {s.text}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{num(s.page)}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        <span className="ms-auto text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {t("reader.page", { n: num(current.page), total: num(content.pages) })}
        </span>
        {/* Bookmark a line: press, then tap the line. */}
        <button
          type="button"
          data-tour="bookmark"
          aria-pressed={placing}
          onClick={() => {
            setPlaced(null);
            setPlacing((p) => !p);
          }}
          aria-label={t("reader.placeBookmark")}
          title={t("reader.placeBookmark")}
          className={cn(
            tool,
            "outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            placing && "tint-bg tint-fg ring-1 ring-[oklch(0.78_0.12_var(--hue,163)/0.5)] hover:tint-bg",
          )}
        >
          <BookmarkPlus className="size-4" />
        </button>
        {/* Back to the bookmark. */}
        <button
          type="button"
          onClick={goToBookmark}
          disabled={!mark}
          aria-label={mark ? t("reader.goToBookmarkPage", { n: num(mark.page) }) : t("reader.noBookmark")}
          title={mark ? `${t("reader.goToBookmarkPage", { n: num(mark.page) })}\n${mark.quote}` : t("reader.noBookmark")}
          className={cn(tool, "outline-none focus-visible:ring-2 focus-visible:ring-ring/50", mark && "tint-fg")}
        >
          <Bookmark className={cn("size-4", mark && "fill-current")} />
        </button>
        {notes.menu}
        <div className="flex items-center">
          <button type="button" onClick={() => resize(-1)} disabled={size === 0} aria-label={t("reader.smaller")} title={t("reader.smaller")} className={tool}>
            <AArrowDown className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={() => resize(1)}
            disabled={size === SIZES.length - 1}
            aria-label={t("reader.larger")}
            title={t("reader.larger")}
            className={tool}
          >
            <AArrowUp className="size-4.5" />
          </button>
        </div>
      </div>

      <div
        ref={box}
        data-tour="text"
        lang="ar"
        dir="rtl"
        style={{ fontSize: SIZES[size] }}
        className={cn(
          "scrollbar-slim overflow-y-auto px-5 py-6 sm:px-8",
          fill ? "h-[calc(100dvh-13rem)] min-h-96" : "max-h-[70vh]",
        )}
      >
        <article
          ref={article}
          onClick={(e) => {
            if (!placing) return notes.onTextClick(e);
            const at = lineAt(e.currentTarget, e.clientX, e.clientY);
            if (at) place(at.b, at.o);
          }}
          onMouseMove={(e) => placing && setHover(lineAt(e.currentTarget, e.clientX, e.clientY))}
          onMouseLeave={() => setHover(null)}
          className={cn(
            // The bookmark's ribbon, the hover band and the glow sit under the text (isolate, -z-10).
            "font-adhkar relative isolate mx-auto max-w-[38em] leading-[2.1] text-foreground/95",
            placing && "cursor-pointer select-none",
          )}
        >
          {placing && hover && (
            <>
              <span
                aria-hidden
                className="pointer-events-none absolute -inset-x-3 -z-10 rounded-lg bg-[oklch(0.78_0.12_var(--hue,163)/0.1)] ring-1 ring-[oklch(0.78_0.12_var(--hue,163)/0.35)]"
                style={{ top: hover.top, height: hover.height }}
              />
              <Ribbon line={hover} ghost />
            </>
          )}
          {flash && (
            <span
              key={flash.key}
              aria-hidden
              className="pointer-events-none absolute -inset-x-3 -z-10 animate-mark-flash rounded-lg motion-reduce:animate-none"
              style={{ top: flash.top, height: flash.height }}
            />
          )}
          {ribbon && mark && <Ribbon key={mark.created} line={ribbon} drop={!!placed} />}
          {content.blocks.map((block, i) => (
            <BlockView key={i} block={block} index={i} />
          ))}
        </article>
      </div>
      {notes.overlay}

      {/* While bookmarking: what to do; once placed: where it went, with Undo. */}
      {(placing || placed) && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 z-10 flex justify-center">
          <div
            dir={isAr ? "rtl" : "ltr"}
            role="status"
            className="tint-border pointer-events-auto flex max-w-full items-center gap-3 rounded-full border bg-popover/95 py-1.5 ps-4 pe-1.5 text-sm shadow-lg backdrop-blur duration-200 animate-in fade-in slide-in-from-bottom-2"
          >
            {placing ? (
              <>
                <BookmarkPlus className="tint-fg size-4 shrink-0" />
                <span className="truncate">{t("reader.placeHint")}</span>
                <button
                  type="button"
                  onClick={() => setPlacing(false)}
                  className="shrink-0 rounded-full px-3 py-1 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  {t("reader.cancel")}
                </button>
              </>
            ) : (
              <>
                <Check className="tint-fg size-4 shrink-0" />
                <span className="truncate">{t("reader.bookmarked", { n: num(placed!.page) })}</span>
                <button
                  type="button"
                  onClick={undoPlace}
                  className="tint-fg shrink-0 rounded-full px-3 py-1 font-medium transition-colors hover:bg-accent"
                >
                  {t("reader.undo")}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * One block of the text; `data-block` (its index) anchors notes and the bookmark on it. The bookmark's
 * ribbon is drawn beside it in the article, so the block's text, which notes count characters in, is untouched.
 */
function BlockView({ block, index }: { block: Block; index: number }) {
  const { t, num } = useLocalize();
  const at = { "data-block": index };
  switch (block.type) {
    case "page":
      // The PDF's page boundary: a hairline with its number, so the two views line up.
      return (
        <div data-page-start={block.n} aria-label={t("reader.pageN", { n: num(block.n) })} className="my-6 flex scroll-mt-4 items-center gap-3 select-none first:mt-0" dir="ltr">
          <span className="h-px flex-1 bg-border" />
          <span className="font-sans text-[0.6875rem] text-muted-foreground tabular-nums">{num(block.n)}</span>
          <span className="h-px flex-1 bg-border" />
        </div>
      );
    case "title":
      return (
        <h2 {...at} className="tint-fg mt-2 mb-3 text-center text-[2em] leading-snug font-bold">
          <Inlines inlines={block.inlines} />
        </h2>
      );
    case "center":
      return (
        <p {...at} className="my-3 text-center text-[0.95em] text-muted-foreground">
          <Inlines inlines={block.inlines} />
        </p>
      );
    case "heading":
      return (
        <h3 {...at} data-section={block.id} className="mt-10 mb-4 flex scroll-mt-4 items-center gap-4 text-[1.3em] leading-snug font-bold">
          <span aria-hidden className="tint-border h-px flex-1 border-t" />
          <span className="tint-fg text-center">
            <Inlines inlines={block.inlines} />
          </span>
          <span aria-hidden className="tint-border h-px flex-1 border-t" />
        </h3>
      );
    case "chapter":
      // The book's ❊ lines: a new chapter inside a section, its opening words in the book's emphasis.
      return (
        <p {...at} data-section={block.id} className="mt-8 mb-3 scroll-mt-4 text-justify">
          <span aria-hidden className="tint-fg me-2 text-[0.8em]">
            ❊
          </span>
          <Inlines inlines={block.inlines} />
        </p>
      );
    case "subheading":
      return (
        <h4 {...at} className="mt-6 mb-2 text-[1.1em] font-bold">
          <Inlines inlines={block.inlines} />
        </h4>
      );
    case "list":
      return (
        <ul {...at} className="my-3 list-disc space-y-1 ps-6 marker:text-muted-foreground">
          {block.items.map((item, i) => (
            <li key={i}>
              <Inlines inlines={item} />
            </li>
          ))}
        </ul>
      );
    case "footnote":
      return (
        <p {...at} className="mt-4 border-t pt-2 text-[0.8em] text-muted-foreground">
          <sup className="tint-fg me-1 font-sans">{block.n}</sup>
          <Inlines inlines={block.inlines} />
        </p>
      );
    default:
      return (
        <p {...at} className="my-3 text-justify">
          <Inlines inlines={block.inlines} />
        </p>
      );
  }
}

function Inlines({ inlines }: { inlines: Inline[] }) {
  const { num } = useLocalize();
  return inlines.map((x, i) => (
    <Fragment key={i}>
      {x.t === "text" && x.v}
      {x.t === "quran" && (
        <>
          <span className="tint-fg">
            ﴿
            {x.v.split(" * ").map((verse, k) => (
              <Fragment key={k}>
                {k > 0 && (
                  // Between consecutive verses, as the printed edition marks them.
                  <span aria-hidden className="mx-1.5 text-[0.6em] text-muted-foreground">
                    ❊
                  </span>
                )}
                {verse}
              </Fragment>
            ))}
            ﴾
          </span>
          {x.ref && <span className="ms-1 align-baseline font-sans text-[0.62em] whitespace-nowrap text-muted-foreground">[{x.ref}]</span>}
        </>
      )}
      {x.t === "quote" && (
        <span className="text-gold">
          «<Inlines inlines={x.inlines} />»
        </span>
      )}
      {x.t === "em" && (
        <span className="tint-fg font-bold">
          <Inlines inlines={x.inlines} />
        </span>
      )}
      {x.t === "note" && <sup className="tint-fg font-sans text-[0.6em]">{x.n}</sup>}
      {x.t === "page" && (
        // A page break inside a paragraph: a small marker in the line.
        <span
          data-page-start={x.n}
          dir="ltr"
          className="mx-1 inline-flex scroll-mt-4 rounded-full border px-1.5 align-middle font-sans text-[0.55em] leading-normal text-muted-foreground tabular-nums"
        >
          {num(x.n)}
        </span>
      )}
    </Fragment>
  ));
}
