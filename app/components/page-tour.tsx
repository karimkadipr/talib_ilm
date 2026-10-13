import { cn } from "cn";
import { CircleHelp } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "~/components/ui/button";
import { useLocalize } from "~/lib/localize";
import { type TourName, tours } from "~/lib/tours";

/**
 * A first-visit tour of a page's features, in the adhkar guide's style: the page dims except for
 * the real element each step is about (marked `data-tour="<target>"`), which stays usable, and a
 * panel at the bottom explains it. Steps whose element isn't on screen are left out (e.g. the
 * lesson's own notes, on a book's page).
 */
export type TourStep = { target: string; title: string; body: string };

/** Opens the tour once on a first visit (after the page settles); `start` replays it. */
export function useTour(name: TourName, enabled = true) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!enabled || tours.seen(name)) return;
    const id = window.setTimeout(() => setOpen(true), 800);
    return () => window.clearTimeout(id);
  }, [name, enabled]);
  const close = useCallback(() => {
    tours.markSeen(name);
    setOpen(false);
  }, [name]);
  const start = useCallback(() => setOpen(true), []);
  return { open, start, close };
}

/** Replays the page's tour. */
export function TourButton({ onClick, className }: { onClick: () => void; className?: string }) {
  const { t } = useLocalize();
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground",
        className,
      )}
    >
      <CircleHelp className="size-3.5" />
      {t("tour.replay")}
    </button>
  );
}

/** The step's element in this layout: the first one marked with its target that's on screen. */
function find(target: string) {
  return [...document.querySelectorAll<HTMLElement>(`[data-tour="${target}"]`)].find((el) => el.getClientRects().length > 0);
}

type Hole = { x: number; y: number; w: number; h: number; r: number; vw: number; vh: number };

const PAD = 8;
/** Below the app's sticky header. */
const TOP = 88;

/** A rounded rectangle as an SVG path, for the hole in the dim. */
function roundRect({ x, y, w, h, r }: Hole) {
  return `M${x + r} ${y}H${x + w - r}A${r} ${r} 0 0 1 ${x + w} ${y + r}V${y + h - r}A${r} ${r} 0 0 1 ${x + w - r} ${y + h}H${x + r}A${r} ${r} 0 0 1 ${x} ${y + h - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
}

export function PageTour({ steps, onClose }: { steps: TourStep[]; onClose: () => void }) {
  const { t, num, isAr } = useLocalize();
  // The targets on screen when the tour opened; the steps' text follows the language.
  const [targets, setTargets] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [hole, setHole] = useState<Hole | null>(null);
  const panel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const found = steps.map((s) => s.target).filter((x) => find(x));
    if (found.length) setTargets(found);
    else onClose();
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const shown = targets ? steps.filter((s) => targets.includes(s.target)) : [];
  const step = shown[index];
  const target = step?.target;
  const last = index === shown.length - 1;

  // Bring the step's element into view above the panel: centred if it fits, else from its top.
  useEffect(() => {
    if (!target) return;
    const id = requestAnimationFrame(() => {
      const el = find(target);
      if (!el) return;
      const r = el.getBoundingClientRect();
      const bottom = (panel.current?.getBoundingClientRect().top ?? window.innerHeight) - 16;
      const room = bottom - TOP;
      const want = r.height + 2 * PAD <= room ? TOP + (room - r.height) / 2 : TOP + PAD;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: r.top - want, behavior: reduce ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [target]);

  // Follow the element as the page scrolls or reflows.
  useEffect(() => {
    if (!target) return;
    let frame = 0;
    const tick = () => {
      const el = find(target);
      if (el) {
        const r = el.getBoundingClientRect();
        const w = r.width + 2 * PAD;
        const h = r.height + 2 * PAD;
        const radius = Math.min(parseFloat(getComputedStyle(el).borderTopLeftRadius) + PAD || PAD, w / 2, h / 2);
        const next = {
          x: Math.round(r.left - PAD),
          y: Math.round(r.top - PAD),
          w: Math.round(w),
          h: Math.round(h),
          r: Math.round(radius),
          vw: document.documentElement.clientWidth,
          vh: window.innerHeight,
        };
        setHole((old) => (old && (Object.keys(next) as (keyof Hole)[]).every((k) => old[k] === next[k]) ? old : next));
      }
      frame = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(frame);
  }, [target]);

  if (!step) return null;

  return (
    <>
      {/* The dim, with a hole over the element: taps elsewhere are caught, the element stays usable. */}
      <div
        aria-hidden
        className="fixed inset-0 z-40 bg-black/70 animate-in fade-in"
        style={
          hole
            ? { clipPath: `path(evenodd, "M0 0H${hole.vw}V${hole.vh}H0Z ${roundRect(hole)}")` }
            : undefined
        }
      />
      {hole && (
        <div
          key={index}
          aria-hidden
          className="pointer-events-none fixed z-40 ring-2 ring-[oklch(0.78_0.12_var(--hue))] animate-in fade-in"
          style={{ left: hole.x, top: hole.y, width: hole.w, height: hole.h, borderRadius: hole.r }}
        />
      )}

      <div ref={panel} className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:start-80">
        <div
          key={index}
          role="dialog"
          aria-labelledby="page-tour-title"
          aria-describedby="page-tour-body"
          dir={isAr ? "rtl" : "ltr"}
          className="tint-border mx-auto max-w-md rounded-2xl border bg-popover p-4 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p id="page-tour-title" className="font-semibold">
              {step.title}
            </p>
            <span className="flex gap-1" aria-label={t("tour.step", { n: num(index + 1), total: num(shown.length) })}>
              {shown.map((s, i) => (
                <span
                  key={s.target}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "tint-solid w-4" : "w-1.5 bg-white/20")}
                />
              ))}
            </span>
          </div>
          <p id="page-tour-body" aria-live="polite" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
          <div className="mt-4 flex items-center gap-2">
            {!last && (
              <button
                type="button"
                onClick={onClose}
                className="-ms-2 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("tour.skip")}
              </button>
            )}
            {index > 0 && (
              <Button size="sm" variant="ghost" className="ms-auto rounded-full" onClick={() => setIndex(index - 1)}>
                {t("tour.back")}
              </Button>
            )}
            <Button
              size="sm"
              className={cn("rounded-full", index === 0 && "ms-auto")}
              onClick={last ? onClose : () => setIndex(index + 1)}
              autoFocus
            >
              {last ? t("tour.done") : t("tour.next")}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}
