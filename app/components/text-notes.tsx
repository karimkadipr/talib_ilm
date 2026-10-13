import { cn } from "cn";
import { MessageSquarePlus, MessageSquareText, NotebookPen, Trash2 } from "lucide-react";
import { type RefObject, useCallback, useEffect, useRef, useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import type { BookContent } from "~/data/book-content";
import { type BookNote, bookNotes, overlapping, type TextPoint, useBookNotes } from "~/lib/book-notes";
import { useLocalize } from "~/lib/localize";

// Notes on passages of a book's text: select words, "Add note", write. Passages are painted with
// the CSS Custom Highlight API (no change to the text's markup, so the Arabic shaping and layout stay
// as they are) and anchored as block index + character offset (see ~/lib/book-notes).

type Draft = { id?: string; start: TextPoint; end: TextPoint; quote: string; page: number; text: string };

const HIGHLIGHT = "book-note";
const HIGHLIGHT_ACTIVE = "book-note-active";

function blockOf(node: Node): HTMLElement | null {
  const el = node.nodeType === Node.ELEMENT_NODE ? (node as Element) : node.parentElement;
  return el?.closest<HTMLElement>("[data-block]") ?? null;
}

/** Characters from the start of `block` to (node, offset). */
function offsetIn(block: HTMLElement, node: Node, offset: number) {
  const r = document.createRange();
  r.setStart(block, 0);
  r.setEnd(node, offset);
  return r.toString().length;
}

/** Where a selection edge falls, snapped into the nearest block it covers (e.g. from a page divider). */
function edgePoint(article: HTMLElement, range: Range, edge: "start" | "end"): TextPoint | null {
  const node = edge === "start" ? range.startContainer : range.endContainer;
  const offset = edge === "start" ? range.startOffset : range.endOffset;
  const block = blockOf(node);
  if (block && article.contains(block)) return { b: Number(block.dataset.block), o: offsetIn(block, node, offset) };
  const covered = [...article.querySelectorAll<HTMLElement>("[data-block]")].filter((b) => range.intersectsNode(b));
  const snap = edge === "start" ? covered[0] : covered.at(-1);
  if (!snap) return null;
  return { b: Number(snap.dataset.block), o: edge === "start" ? 0 : (snap.textContent ?? "").length };
}

/** The DOM position of a text point. */
function domPoint(article: HTMLElement, p: TextPoint): [Node, number] | null {
  const block = article.querySelector(`[data-block="${p.b}"]`);
  if (!block) return null;
  const walker = document.createTreeWalker(block, NodeFilter.SHOW_TEXT);
  let left = p.o;
  let last: Node | null = null;
  for (let n = walker.nextNode(); n; n = walker.nextNode()) {
    const len = n.textContent?.length ?? 0;
    if (left <= len) return [n, left];
    left -= len;
    last = n;
  }
  return last ? [last, last.textContent?.length ?? 0] : [block, 0];
}

function toRange(article: HTMLElement, note: { start: TextPoint; end: TextPoint }) {
  const a = domPoint(article, note.start);
  const b = domPoint(article, note.end);
  if (!a || !b) return null;
  const r = document.createRange();
  r.setStart(...a);
  r.setEnd(...b);
  return r;
}

/** The text position under a click, across browsers. */
function caretAt(x: number, y: number): [Node, number] | null {
  const doc = document as Document & { caretRangeFromPoint?: (x: number, y: number) => Range | null };
  const pos = doc.caretPositionFromPoint?.(x, y);
  if (pos) return [pos.offsetNode, pos.offset];
  const r = doc.caretRangeFromPoint?.(x, y);
  return r ? [r.startContainer, r.startOffset] : null;
}

const canHighlight = () => typeof CSS !== "undefined" && "highlights" in CSS;

/**
 * Notes for the book text in `box`/`article`: returns the toolbar's notes menu and the overlay (the
 * "Add note" pill over a selection, and the editor), both positioned in `wrap`.
 */
export function useTextNotes({
  bookId,
  content,
  wrap,
  box,
  article,
  layoutKey,
}: {
  bookId: string;
  content: BookContent;
  wrap: RefObject<HTMLDivElement | null>;
  box: RefObject<HTMLDivElement | null>;
  article: RefObject<HTMLElement | null>;
  /** Changes when the text reflows (e.g. its size), so the pill can follow. */
  layoutKey: unknown;
}) {
  const { t, num } = useLocalize();
  const notes = useBookNotes(bookId);
  // Where the selection's button goes, and the note the selection runs into, if any: passages can't overlap.
  const [pill, setPill] = useState<{ x: number; y: number; clash?: BookNote } | null>(null);
  const [draft, setDraft] = useState<Draft | null>(null);
  const ranges = useRef(new Map<string, Range>());

  const pageOf = (b: number) => {
    const block = content.blocks[b];
    return block ? (block.type === "page" ? block.n : block.page) : 1;
  };

  // The "Add note" pill follows a selection inside the text.
  const placePill = useCallback(() => {
    const sel = window.getSelection();
    const art = article.current;
    const w = wrap.current;
    if (!sel || sel.isCollapsed || !sel.rangeCount || !art || !w) return setPill(null);
    const range = sel.getRangeAt(0);
    if (!art.contains(range.commonAncestorContainer)) return setPill(null);
    const rect = range.getBoundingClientRect();
    const frame = w.getBoundingClientRect();
    const boxRect = box.current?.getBoundingClientRect() ?? frame;
    const x = Math.min(Math.max(rect.left + rect.width / 2 - frame.left, 70), frame.width - 70);
    // Below the selection, kept inside the visible part of the text.
    const y = Math.min(Math.max(rect.bottom - frame.top + 8, boxRect.top - frame.top + 8), boxRect.bottom - frame.top - 44);
    const start = edgePoint(art, range, "start");
    const end = edgePoint(art, range, "end");
    setPill({ x, y, clash: start && end ? overlapping(notes, { start, end }) : undefined });
  }, [article, box, wrap, notes]);

  useEffect(() => {
    let frame = 0;
    const later = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(placePill);
    };
    document.addEventListener("selectionchange", later);
    const el = box.current;
    el?.addEventListener("scroll", later, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("selectionchange", later);
      el?.removeEventListener("scroll", later);
    };
  }, [placePill, box]);
  useEffect(placePill, [layoutKey, placePill]);

  // Paint the passages; the one being edited (or the new one) stands out.
  useEffect(() => {
    const art = article.current;
    ranges.current.clear();
    if (!art) return;
    for (const n of notes) {
      const r = toRange(art, n);
      if (r) ranges.current.set(n.id, r);
    }
    if (!canHighlight()) return;
    const active = draft ? (draft.id ? ranges.current.get(draft.id) : toRange(art, draft)) : null;
    const rest = [...ranges.current.entries()].filter(([id]) => id !== draft?.id).map(([, r]) => r);
    CSS.highlights.set(HIGHLIGHT, new Highlight(...rest));
    if (active) CSS.highlights.set(HIGHLIGHT_ACTIVE, new Highlight(active));
    else CSS.highlights.delete(HIGHLIGHT_ACTIVE);
    return () => {
      CSS.highlights.delete(HIGHLIGHT);
      CSS.highlights.delete(HIGHLIGHT_ACTIVE);
    };
  }, [notes, draft, article, layoutKey]);

  function startNote() {
    const sel = window.getSelection();
    const art = article.current;
    if (!sel?.rangeCount || !art) return;
    const range = sel.getRangeAt(0);
    const start = edgePoint(art, range, "start");
    const end = edgePoint(art, range, "end");
    if (!start || !end) return;
    const quote = range.toString().replace(/\s+/g, " ").trim().slice(0, 400);
    if (!quote) return;
    sel.removeAllRanges();
    setPill(null);
    // Passages never overlap: a selection that runs into a note opens that note instead.
    const clash = overlapping(notes, { start, end });
    if (clash) return open(clash);
    setDraft({ start, end, quote, page: pageOf(start.b), text: "" });
  }

  function open(note: BookNote, scroll = false) {
    setDraft({ ...note });
    const r = ranges.current.get(note.id);
    const el = box.current;
    if (scroll && r && el) {
      const top = r.getBoundingClientRect().top - el.getBoundingClientRect().top;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollBy({ top: top - el.clientHeight / 4, behavior: reduce ? "auto" : "smooth" });
    }
  }

  // A click on a painted passage opens its note (the shortest, where passages overlap).
  const onTextClick = (e: React.MouseEvent) => {
    if (!window.getSelection()?.isCollapsed) return;
    const at = caretAt(e.clientX, e.clientY);
    if (!at) return;
    const hit = notes
      .filter((n) => ranges.current.get(n.id)?.isPointInRange(...at))
      .sort((a, b) => a.quote.length - b.quote.length)[0];
    if (hit) open(hit);
  };

  function save() {
    if (!draft) return;
    const text = draft.text.trim();
    if (draft.id) bookNotes.setText(bookId, draft.id, text);
    else bookNotes.add(bookId, { start: draft.start, end: draft.end, quote: draft.quote, page: draft.page, text });
    setDraft(null);
  }

  function remove() {
    if (draft?.id) bookNotes.remove(bookId, draft.id);
    setDraft(null);
  }

  const menu = (
    <DropdownMenu>
      <DropdownMenuTrigger
        data-tour="notes"
        className="flex h-8 items-center gap-1.5 rounded-full px-2.5 text-sm text-muted-foreground transition-colors outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
        aria-label={t("reader.notes")}
        title={t("reader.notes")}
      >
        <NotebookPen className="size-4" />
        {notes.length > 0 && <span className="text-xs tabular-nums">{num(notes.length)}</span>}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" onCloseAutoFocus={(e) => e.preventDefault()} className="max-h-96 w-80 rounded-xl p-1.5">
        {notes.length === 0 ? (
          <p className="px-3 py-2.5 text-sm text-muted-foreground">{t("reader.notesEmpty")}</p>
        ) : (
          notes.map((n) => (
            <DropdownMenuItem key={n.id} onSelect={() => open(n, true)} className="flex-col items-stretch gap-1 rounded-lg px-3 py-2">
              <span className="flex items-baseline justify-between gap-3">
                <span lang="ar" dir="rtl" className="font-arabic line-clamp-1 flex-1 text-base text-foreground">
                  {n.quote}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{num(n.page)}</span>
              </span>
              {n.text && (
                <span dir="auto" className="line-clamp-2 text-xs text-muted-foreground">
                  {n.text}
                </span>
              )}
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const overlay = (
    <>
      {pill && !draft && (
        <button
          type="button"
          // Keep the selection: it's read when the button is clicked.
          onPointerDown={(e) => e.preventDefault()}
          onClick={startNote}
          style={{ left: pill.x, top: pill.y }}
          title={pill.clash ? t("reader.overlapHint") : undefined}
          className={cn(
            "absolute z-10 flex -translate-x-1/2 items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap shadow-lg shadow-black/40 transition-transform active:scale-95",
            pill.clash ? "border bg-card text-foreground" : "tint-solid text-black/85",
          )}
        >
          {pill.clash ? <MessageSquareText className="size-4" /> : <MessageSquarePlus className="size-4" />}
          {pill.clash ? t("reader.openOverlap") : t("reader.addNote")}
        </button>
      )}
      {draft && (
        <div
          role="dialog"
          aria-label={draft.id ? t("reader.editNote") : t("reader.addNote")}
          className="absolute inset-x-0 bottom-0 z-10 space-y-3 border-t bg-card/95 p-4 shadow-[0_-12px_30px_-12px_rgb(0_0_0/0.6)] backdrop-blur-xl"
          onKeyDown={(e) => {
            if (e.key === "Escape") setDraft(null);
            if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) save();
          }}
        >
          <p lang="ar" dir="rtl" className="font-arabic tint-border line-clamp-2 border-s-2 ps-3 text-base text-muted-foreground">
            {draft.quote}
          </p>
          <textarea
            autoFocus
            value={draft.text}
            onChange={(e) => setDraft({ ...draft, text: e.target.value })}
            placeholder={t("reader.notePlaceholder")}
            dir="auto"
            rows={3}
            className="w-full resize-none rounded-xl border bg-background/60 p-3 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          />
          <div className="flex items-center gap-2">
            {draft.id && (
              <button
                type="button"
                onClick={remove}
                className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
              >
                <Trash2 className="size-4" />
                {t("reader.deleteNote")}
              </button>
            )}
            <button
              type="button"
              onClick={() => setDraft(null)}
              className="ms-auto rounded-full px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("reader.cancel")}
            </button>
            <button
              type="button"
              onClick={save}
              className={cn("rounded-full bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90")}
            >
              {t("reader.saveNote")}
            </button>
          </div>
        </div>
      )}
    </>
  );

  return { menu, overlay, onTextClick };
}
