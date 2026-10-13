import { cn } from "cn";
import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useCallback, useEffect, useRef, useState } from "react";
import { BookText } from "~/components/book-text";
import type { BookContent } from "~/data/book-content";
import type { BookText as BookPdf } from "~/data/book-texts";
import { bookmarks } from "~/lib/book-bookmark";
import { useLocalize } from "~/lib/localize";

const PAGE_KEY = (bookId: string) => `islamic-studies:reader:${bookId}`;
const VIEW_KEY = "islamic-studies:reader:view";

type View = "text" | "pdf";

function readPage(bookId: string) {
  try {
    return Number(localStorage.getItem(PAGE_KEY(bookId))) || 1;
  } catch {
    return 1;
  }
}

function writePage(bookId: string, page: number) {
  try {
    localStorage.setItem(PAGE_KEY(bookId), String(page));
  } catch {
    // Storage blocked: the reader just opens on the first page next time.
  }
}

/**
 * The book's text beside its lessons. When the matn has been typed out it opens in the app's own
 * reading style (BookText), with the original PDF a tap away; otherwise it shows the PDF. Both
 * views share the page, so switching keeps the listener's place, and it's remembered per book. On
 * arriving it opens at the book's bookmark, if the listener has placed one.
 */
export function BookReader({
  bookId,
  text,
  content,
  fill = false,
}: {
  bookId: string;
  text: BookPdf;
  content?: BookContent;
  /** Let the text fill the height of the window (the lesson page's side-by-side view). */
  fill?: boolean;
}) {
  const { l, t } = useLocalize();
  const [view, setView] = useState<View>(content ? "text" : "pdf");
  // Unknown until the saved page is read after mount (SSR has no storage); the text view waits for
  // it, so it opens in the right place instead of reporting page 1 over the saved one.
  const [saved, setPage] = useState<number | null>(null);
  const page = saved ?? 1;
  const total = content?.pages ?? text.pages;
  // Until the listener switches views: the text opens at the bookmark rather than where they left off.
  const [landing, setLanding] = useState(true);

  useEffect(() => setPage(Math.min(bookmarks.get(bookId)?.page ?? readPage(bookId), total)), [bookId, total]);
  useEffect(() => {
    if (!content) return;
    try {
      if (localStorage.getItem(VIEW_KEY) === "pdf") setView("pdf");
    } catch {}
  }, [content]);

  const go = useCallback(
    (to: number) => {
      const next = Math.min(Math.max(1, to), total);
      setPage(next);
      writePage(bookId, next);
    },
    [bookId, total],
  );

  function choose(next: View) {
    setView(next);
    setLanding(false);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {}
  }

  return (
    <div className="space-y-3">
      {content && (
        <div role="tablist" aria-label={t("reader.view")} className="inline-flex rounded-full border bg-card p-1 text-sm">
          {(["text", "pdf"] as const).map((v) => (
            <button
              key={v}
              type="button"
              role="tab"
              aria-selected={view === v}
              onClick={() => choose(v)}
              className={cn(
                "rounded-full px-3.5 py-1 transition-colors",
                view === v ? "bg-accent font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {v === "text" ? t("reader.viewText") : t("reader.viewPdf")}
            </button>
          ))}
        </div>
      )}

      {content && view === "text" ? (
        saved === null ? (
          <div className="h-[70vh] max-h-96 rounded-2xl border bg-card" />
        ) : (
          <BookText bookId={bookId} content={content} page={page} onPage={go} fill={fill} landing={landing} />
        )
      ) : (
        <PdfView text={text} page={page} go={go} />
      )}

      <p className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-xs text-muted-foreground">
        <span>
          {l(text.edition)} · {t("watch.source")}{" "}
          <a href={text.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {l(text.source.name)}
          </a>
        </span>
        <a href={text.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 hover:text-foreground">
          {t("reader.open")}
          <ExternalLink className="size-3" />
        </a>
      </p>
    </div>
  );
}

/**
 * The PDF one page at a time, sized to the column. Rendered with PDF.js (loaded on demand, client
 * only), so the file is only fetched when this view is shown.
 */
function PdfView({ text, page, go }: { text: BookPdf; page: number; go: (page: number) => void }) {
  const { t, num, isAr } = useLocalize();
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [aspect, setAspect] = useState(1.45);
  const [width, setWidth] = useState(0);
  const [drawing, setDrawing] = useState(true);
  const total = doc?.numPages ?? text.pages;

  // Load the document (PDF.js only ever runs in the browser).
  useEffect(() => {
    let cancelled = false;
    let loaded: PDFDocumentProxy | null = null;
    setFailed(false);
    (async () => {
      try {
        const pdfjs = await import("pdfjs-dist");
        pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;
        loaded = await pdfjs.getDocument({ url: text.src }).promise;
        if (cancelled) return void loaded.destroy();
        setDoc(loaded);
      } catch {
        if (!cancelled) setFailed(true);
      }
    })();
    return () => {
      cancelled = true;
      void loaded?.destroy();
    };
  }, [text.src, attempt]);

  // Follow the column's width.
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const observer = new ResizeObserver(([entry]) => setWidth(Math.floor(entry.contentRect.width)));
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Draw the current page at the column's width (sharp on high-density screens).
  useEffect(() => {
    if (!doc || !width || !canvas.current) return;
    let task: RenderTask | null = null;
    let cancelled = false;
    setDrawing(true);
    (async () => {
      const p = await doc.getPage(Math.min(page, doc.numPages));
      if (cancelled) return;
      const base = p.getViewport({ scale: 1 });
      setAspect(base.height / base.width);
      const ratio = window.devicePixelRatio || 1;
      const viewport = p.getViewport({ scale: (width / base.width) * ratio });
      const el = canvas.current!;
      el.width = Math.floor(viewport.width);
      el.height = Math.floor(viewport.height);
      task = p.render({ canvasContext: el.getContext("2d")!, viewport });
      try {
        await task.promise;
        if (!cancelled) setDrawing(false);
      } catch {
        // Cancelled by a newer page or size.
      }
    })();
    return () => {
      cancelled = true;
      task?.cancel();
    };
  }, [doc, page, width]);

  // Arabic books turn right-to-left: "previous" sits on the right, as in a printed copy.
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;
  const navButton =
    "inline-flex shrink-0 items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <>
      <div ref={box} className="relative overflow-hidden rounded-2xl border bg-white" style={{ aspectRatio: `1 / ${aspect}` }}>
        {failed ? (
          <div role="alert" className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-card p-6 text-center">
            <p className="font-medium">{t("reader.error")}</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
            >
              {t("watch.retry")}
            </button>
          </div>
        ) : (
          <>
            <canvas ref={canvas} aria-label={t("reader.page", { n: num(page), total: num(total) })} className="block size-full" />
            {(!doc || drawing) && (
              <div className="absolute inset-0 flex items-center justify-center bg-white/60">
                <Loader2 aria-label={t("reader.loading")} className="size-6 animate-spin text-neutral-500" />
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <button type="button" onClick={() => go(page - 1)} disabled={page <= 1} className={navButton}>
          <PrevIcon className="size-4" />
          {t("reader.prev")}
        </button>
        <span
          aria-label={t("reader.page", { n: num(page), total: num(total) })}
          className="text-sm whitespace-nowrap text-muted-foreground tabular-nums"
        >
          <span dir="ltr">
            {num(page)} / {num(total)}
          </span>
        </span>
        <button type="button" onClick={() => go(page + 1)} disabled={page >= total} className={navButton}>
          {t("reader.next")}
          <NextIcon className="size-4" />
        </button>
      </div>
    </>
  );
}
