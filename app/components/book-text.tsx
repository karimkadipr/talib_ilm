import { cn } from "cn";
import { AArrowDown, AArrowUp, Bookmark, BookmarkPlus, BookmarkX, ListTree } from "lucide-react";
import { Fragment, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { Block, BookContent, Inline } from "~/data/book-content";
import { useTextNotes } from "~/components/text-notes";
import { bookmarks, useBookmark } from "~/lib/book-bookmark";
import { useLocalize } from "~/lib/localize";

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

/** Briefly lights up a paragraph, so the listener sees where the bookmark is. */
function glow(target: HTMLElement | null | undefined) {
  if (!target?.animate) return;
  const hue = getComputedStyle(target).getPropertyValue("--hue").trim() || "163";
  const color = `oklch(0.78 0.12 ${hue} / 0.22)`;
  target.animate(
    [
      { backgroundColor: color, boxShadow: `0 0 0 0.4em ${color}`, borderRadius: "0.4em" },
      { backgroundColor: "transparent", boxShadow: "0 0 0 0.4em transparent", borderRadius: "0.4em" },
    ],
    { duration: 1800, easing: "ease-out" },
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
  const { t, num } = useLocalize();
  const box = useRef<HTMLDivElement>(null);
  const wrap = useRef<HTMLDivElement>(null);
  const article = useRef<HTMLElement>(null);
  const [size, setSize] = useState(1);
  const [current, setCurrent] = useState({ page, section: "" });
  const mark = useBookmark(bookId);
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
    // Keep the bookmarked paragraph at the top while the text settles (the page's layout, the fonts),
    // until the listener takes over.
    const target = () => el.querySelector<HTMLElement>(`[data-block="${saved.b}"]`);
    const hold = () => scrollBoxTo(el, target(), "auto");
    hold();
    // Show the listener where they've landed.
    const lit = setTimeout(() => glow(target()), 400);
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

  /**
   * Bookmarks the paragraph at the top of the view (moving the book's one bookmark there): the first
   * one that starts in the top half of the view, so its ribbon is on screen. Failing that (one long
   * paragraph fills the view), the one running through the top, brought down so its start shows.
   */
  function placeBookmark() {
    const el = box.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top;
    const blocks = [...el.querySelectorAll<HTMLElement>("[data-block]")];
    const target =
      blocks.find((b) => {
        const at = b.getBoundingClientRect().top;
        return at >= top - 2 && at < top + el.clientHeight / 2;
      }) ?? blocks.find((b) => b.getBoundingClientRect().bottom > top + 24);
    if (!target) return;
    const b = Number(target.dataset.block);
    const block = content.blocks[b];
    const quote = (target.textContent ?? "").replace(/\s+/g, " ").trim().slice(0, 120);
    bookmarks.set(bookId, { b, page: block && block.type !== "page" ? block.page : current.page, quote });
    if (target.getBoundingClientRect().top < top) jump(`[data-block="${b}"]`);
    glow(target);
  }

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
        <DropdownMenu>
          <DropdownMenuTrigger
            data-tour="bookmark"
            className={cn(tool, "outline-none focus-visible:ring-2 focus-visible:ring-ring/50", mark && "tint-fg")}
            aria-label={t("reader.bookmark")}
            title={t("reader.bookmark")}
          >
            <Bookmark className={cn("size-4", mark && "fill-current")} />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()} className="w-72 rounded-xl p-1.5">
            {mark && (
              <DropdownMenuItem onSelect={() => glow(jump(`[data-block="${mark.b}"]`))} className="flex-col items-stretch gap-1 rounded-lg px-3 py-2">
                <span className="text-xs text-muted-foreground">{t("reader.goToBookmark")}</span>
                <span className="flex items-baseline justify-between gap-3">
                  <span lang="ar" dir="rtl" className="font-arabic line-clamp-1 flex-1 text-base text-foreground">
                    {mark.quote}
                  </span>
                  <span className="text-xs text-muted-foreground tabular-nums">{num(mark.page)}</span>
                </span>
              </DropdownMenuItem>
            )}
            <DropdownMenuItem onSelect={placeBookmark} className="rounded-lg px-3 py-2">
              <BookmarkPlus />
              {mark ? t("reader.moveBookmark") : t("reader.addBookmark")}
            </DropdownMenuItem>
            {mark && (
              <DropdownMenuItem variant="destructive" onSelect={() => bookmarks.remove(bookId)} className="rounded-lg px-3 py-2">
                <BookmarkX />
                {t("reader.removeBookmark")}
              </DropdownMenuItem>
            )}
            <p className="px-3 pt-1 pb-1.5 text-xs text-muted-foreground">{t("reader.bookmarkHint")}</p>
          </DropdownMenuContent>
        </DropdownMenu>
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
          onClick={notes.onTextClick}
          className="font-adhkar mx-auto max-w-[38em] leading-[2.1] text-foreground/95"
        >
          {content.blocks.map((block, i) => (
            <BlockView key={i} block={block} index={i} marked={mark?.b === i} />
          ))}
        </article>
      </div>
      {notes.overlay}
    </div>
  );
}

/**
 * One block of the text; `data-block` (its index) anchors notes and the bookmark on it. The bookmark's
 * ribbon is drawn by CSS (app.css), so the block's text, which notes count characters in, is untouched.
 */
function BlockView({ block, index, marked }: { block: Block; index: number; marked: boolean }) {
  const { t, num } = useLocalize();
  const at = { "data-block": index, "data-bookmarked": marked || undefined };
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
