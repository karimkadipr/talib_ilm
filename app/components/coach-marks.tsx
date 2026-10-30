import { cn } from "cn";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Button } from "~/components/ui/button";
import { useLocalize } from "~/lib/localize";

// A first-visit tour: each step lights up a real control, the rest of the screen dimmed, with a card
// saying what it does. Shown once per tour (kept in localStorage; once per tab if storage is blocked).
// Steps whose control isn't on the page (e.g. an empty list) are left out. It steps aside while a
// dialog or sheet is open, so trying a control out doesn't end up under it.

export type CoachStep = {
  id: string;
  /** The control to light up: the copy shown at this screen size when there are several. */
  target: () => Element | null;
  title: string;
  body: string;
};

const seenThisTab = new Set<string>();

function seen(key: string) {
  if (seenThisTab.has(key)) return true;
  try {
    return window.localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function markSeen(key: string) {
  seenThisTab.add(key);
  try {
    window.localStorage.setItem(key, "1");
  } catch {
    // Storage blocked: remembered for this tab only.
  }
}

/** The first of these elements that is shown (not display: none). */
export function visible(selector: string) {
  return [...document.querySelectorAll(selector)].find((el) => el.getClientRects().length > 0) ?? null;
}

export function CoachMarks({
  storageKey,
  hue,
  steps,
  paused = false,
  completed = false,
}: {
  storageKey: string;
  hue: number;
  steps: CoachStep[];
  /** Out of the way for now, e.g. while a panel it would cover is open. */
  paused?: boolean;
  /** The last step was done for real (e.g. the ayah tapped): the tour is over. */
  completed?: boolean;
}) {
  const { t, num, isAr } = useLocalize();
  // The steps available when it started, and where it is.
  const [ids, setIds] = useState<string[] | null>(null);
  const [index, setIndex] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);
  const [covered, setCovered] = useState(false);
  const step = ids ? steps.find((s) => s.id === ids[index]) : undefined;

  const close = useCallback(() => {
    markSeen(storageKey);
    setIds(null);
  }, [storageKey]);

  useEffect(() => {
    if (seen(storageKey)) return;
    // Once the page has laid out.
    const id = window.setTimeout(() => {
      const available = steps.filter((s) => s.target()).map((s) => s.id);
      if (available.length) setIds(available);
    }, 900);
    return () => window.clearTimeout(id);
    // Started once, with the steps as they are then.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageKey]);

  useEffect(() => {
    if (ids && completed && index === ids.length - 1) close();
  }, [ids, index, completed, close]);

  // Brought into view, then followed as the page lays out, scrolls or resizes.
  const stepId = step?.id;
  useEffect(() => {
    if (!stepId) return;
    const current = steps.find((s) => s.id === stepId)!;
    const el = current.target();
    const r = el?.getBoundingClientRect();
    if (el && r && (r.top < 64 || r.bottom > window.innerHeight - 220)) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      el.scrollIntoView({ block: "center", behavior: reduce ? "auto" : "smooth" });
    }
    const measure = () => {
      setRect(current.target()?.getBoundingClientRect() ?? null);
      setCovered(!!document.querySelector("[role='dialog'][data-state='open']"));
    };
    measure();
    const id = window.setInterval(measure, 200);
    window.addEventListener("resize", measure);
    window.addEventListener("scroll", measure, true);
    return () => {
      window.clearInterval(id);
      window.removeEventListener("resize", measure);
      window.removeEventListener("scroll", measure, true);
    };
    // The steps' text changes with the language, their targets don't.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stepId]);

  useEffect(() => {
    if (!stepId) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [stepId, close]);

  if (!ids || !step || paused || covered) return null;

  const last = index === ids.length - 1;
  // The card sits opposite the lit control.
  const atTop = !!rect && rect.top + rect.height / 2 > window.innerHeight * 0.55;
  const pad = 6;

  return createPortal(
    <div style={{ "--hue": hue } as React.CSSProperties}>
      {rect ? (
        <div
          aria-hidden
          className="pointer-events-none fixed z-[60] rounded-2xl ring-2 ring-[oklch(0.78_0.12_var(--hue))] transition-[top,left,width,height] duration-300 motion-reduce:transition-none"
          style={{
            top: rect.top - pad,
            left: rect.left - pad,
            width: rect.width + 2 * pad,
            height: rect.height + 2 * pad,
            boxShadow: "0 0 0 200vmax rgb(0 0 0 / 0.7)",
          }}
        />
      ) : (
        <div aria-hidden className="pointer-events-none fixed inset-0 z-[60] bg-black/70" />
      )}
      <div
        className={cn(
          "fixed inset-x-0 z-[61] px-4 lg:start-80",
          atTop ? "top-0 pt-[calc(1rem+env(safe-area-inset-top,0px))]" : "bottom-0 pb-[calc(1rem+env(safe-area-inset-bottom,0px))]",
        )}
      >
        <div
          key={step.id}
          role="dialog"
          aria-labelledby="coach-title"
          aria-describedby="coach-body"
          dir={isAr ? "rtl" : "ltr"}
          className={cn(
            "tint-border mx-auto max-w-md rounded-2xl border bg-popover p-4 shadow-2xl shadow-black/60 animate-in fade-in",
            atTop ? "slide-in-from-top-3" : "slide-in-from-bottom-3",
          )}
        >
          <div className="flex items-center justify-between gap-3">
            <p id="coach-title" className="font-semibold">
              {step.title}
            </p>
            {ids.length > 1 && (
              <span className="flex shrink-0 gap-1" aria-label={t("adhkar.guideStep", { n: num(index + 1), total: num(ids.length) })}>
                {ids.map((id, i) => (
                  <span key={id} className={cn("h-1.5 rounded-full transition-all", i === index ? "tint-solid w-4" : "w-1.5 bg-white/20")} />
                ))}
              </span>
            )}
          </div>
          <p id="coach-body" aria-live="polite" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {step.body}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {last ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={close}
                className="-ms-2 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("adhkar.guideSkip")}
              </button>
            )}
            <Button size="sm" className="rounded-full" onClick={() => (last ? close() : setIndex(index + 1))} autoFocus>
              {last ? t("adhkar.guideDone") : t("adhkar.guideContinue")}
            </Button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
