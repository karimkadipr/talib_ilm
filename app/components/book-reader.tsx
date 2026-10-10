import { ChevronLeft, ChevronRight, ExternalLink, Loader2 } from "lucide-react";
import type { PDFDocumentProxy, RenderTask } from "pdfjs-dist";
import workerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";
import type { BookText } from "~/data/book-texts";
import { useLocalize } from "~/lib/localize";

const PAGE_KEY = (bookId: string) => `islamic-studies:reader:${bookId}`;

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
 * The book's PDF, one page at a time, sized to the column, so the listener can follow the text
 * while the lesson plays. Rendered with PDF.js (loaded on demand, client only) and remembers the
 * page per book.
 */
export function BookReader({ bookId, text }: { bookId: string; text: BookText }) {
  const { l, t, num, isAr } = useLocalize();
  const box = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [doc, setDoc] = useState<PDFDocumentProxy | null>(null);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [page, setPage] = useState(1);
  const [aspect, setAspect] = useState(1.45);
  const [width, setWidth] = useState(0);
  const [drawing, setDrawing] = useState(true);
  const total = doc?.numPages ?? text.pages;

  useEffect(() => setPage(Math.min(readPage(bookId), text.pages)), [bookId, text.pages]);

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

  function go(to: number) {
    const next = Math.min(Math.max(1, to), total);
    setPage(next);
    writePage(bookId, next);
  }

  // Arabic books turn right-to-left: "previous" sits on the right, as in a printed copy.
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;
  const navButton =
    "inline-flex shrink-0 items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm whitespace-nowrap text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40";

  return (
    <div className="space-y-3">
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
