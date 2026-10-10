import { cn } from "cn";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalize } from "~/lib/localize";

/**
 * Horizontal card rail with start/end arrow buttons that appear only while there is more
 * to scroll that way. Direction-aware: in RTL scrollLeft runs from 0 to negative, so edges
 * are measured on its absolute value and the scroll step is flipped.
 */
export function ScrollRail({ children, className }: { children: React.ReactNode; className?: string }) {
  const { t } = useLocalize();
  const ref = useRef<HTMLDivElement>(null);
  const [edges, setEdges] = useState({ start: false, end: false });

  const update = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const pos = Math.abs(el.scrollLeft);
    setEdges({ start: pos > 1, end: pos + el.clientWidth < el.scrollWidth - 1 });
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    for (const child of el.children) ro.observe(child);
    return () => ro.disconnect();
  }, [update, children]);

  const scroll = (towardsEnd: boolean) => {
    const el = ref.current;
    if (!el) return;
    const rtl = getComputedStyle(el).direction === "rtl";
    const step = el.clientWidth * 0.8 * (towardsEnd ? 1 : -1) * (rtl ? -1 : 1);
    el.scrollBy({ left: step, behavior: "smooth" });
  };

  const arrow =
    "absolute top-1/2 z-10 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border bg-background/85 text-foreground shadow-lg backdrop-blur transition-[opacity,background-color] duration-200 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

  return (
    <div className="relative">
      <div ref={ref} onScroll={update} className={cn("scrollbar-slim overflow-x-auto", className)}>
        {children}
      </div>
      <button
        type="button"
        aria-label={t("nav.scrollPrev")}
        tabIndex={edges.start ? 0 : -1}
        aria-hidden={!edges.start}
        onClick={() => scroll(false)}
        className={cn(arrow, "start-1 sm:-start-4", !edges.start && "pointer-events-none opacity-0")}
      >
        <ChevronLeft className="size-5 rtl:rotate-180" />
      </button>
      <button
        type="button"
        aria-label={t("nav.scrollNext")}
        tabIndex={edges.end ? 0 : -1}
        aria-hidden={!edges.end}
        onClick={() => scroll(true)}
        className={cn(arrow, "end-1 sm:-end-4", !edges.end && "pointer-events-none opacity-0")}
      >
        <ChevronRight className="size-5 rtl:rotate-180" />
      </button>
    </div>
  );
}
