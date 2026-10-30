import { cn } from "cn";
import { ArrowUpDown, Check, CircleHelp, Moon, RotateCcw, ScrollText, Sun } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { data } from "react-router";
import { AdhkarGuide, type GuideStep, TapHint } from "~/components/adhkar-guide";
import { AdhkarReorder } from "~/components/adhkar-reorder";
import { BackLink } from "~/components/back-link";
import { DhikrGrading } from "~/components/dhikr-grading";
import { categoryOf } from "~/data/categories";
import { getAdhkarCollection } from "~/data/adhkar";
import { getAdhkar } from "~/data/adhkar.server";
import { adhkarGuide } from "~/lib/adhkar-guide";
import { adhkarOrder, useAdhkarOrder } from "~/lib/adhkar-order";
import { adhkarProgress, useAdhkarDone } from "~/lib/adhkar-progress";
import { useLocalize } from "~/lib/localize";
import { pageMeta } from "~/lib/meta";
import { localizer, seo } from "~/lib/meta.server";
import type { Route } from "./+types/route";

export async function loader({ params, context }: Route.LoaderArgs) {
  const collection = getAdhkarCollection(params.collectionId);
  if (!collection) throw data(null, { status: 404 });
  return {
    collectionId: collection.id,
    meta: seo(context, [localizer(context).l(collection.name)]),
    adhkar: getAdhkar(collection.id),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

export default function AdhkarPage({ loaderData }: Route.ComponentProps) {
  const collection = getAdhkarCollection(loaderData.collectionId)!;
  const { adhkar } = loaderData;
  const category = categoryOf("adhkar", collection.id);
  const done = useAdhkarDone(collection.id, adhkar.length);
  // Original indices in the reader's order; counts and card refs stay keyed by original index.
  const order = useAdhkarOrder(collection.id, adhkar.length);
  const { l, t, num, isAr } = useLocalize();
  // UI-language text on this right-to-left page keeps its own direction so it isn't scrambled.
  const uiDir = isAr ? "rtl" : "ltr";
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const header = useRef<HTMLElement>(null);
  const reorderButton = useRef<HTMLButtonElement>(null);
  const finished = adhkar.filter((d, i) => done[i] >= d.count).length;
  const Icon = collection.icon === "sun" ? Sun : Moon;

  // First-visit guide: the step and the card (original index) it lifts above the dim.
  const [guide, setGuide] = useState<{ step: GuideStep; i: number } | null>(null);
  const latest = useRef({ done, order });
  latest.current = { done, order };

  // The dhikr whose source and grading are open; kept while the dialog closes so it can animate out.
  const [source, setSource] = useState<{ i: number; open: boolean } | null>(null);
  const [reordering, setReordering] = useState(false);

  // The latest tap's ripple: the card, where it was pressed, and a key that restarts the animation.
  const [ripple, setRipple] = useState<{ i: number; x: number; y: number; size: number; key: number } | null>(null);

  const startGuide = useCallback(() => {
    const { done, order } = latest.current;
    const first = order.find((k) => done[k] < adhkar[k].count);
    if (first !== undefined) setGuide({ step: "tap", i: first });
  }, [adhkar]);

  // Keep the guided card in view above the guide's panel, from its top (where the tap hint sits); for
  // the ⇅ step, the header, far enough up that its reorder button clears the panel.
  const guideStep = guide?.step;
  const guideCard = guide?.i;
  useEffect(() => {
    if (guideCard === undefined) return;
    const id = requestAnimationFrame(() => {
      const el = guideStep === "menu" ? header.current : cards.current[guideCard];
      if (!el) return;
      const r = el.getBoundingClientRect();
      const panel = document.getElementById("adhkar-guide")?.getBoundingClientRect().top ?? window.innerHeight;
      let delta = r.top - 88;
      const button = reorderButton.current?.getBoundingClientRect();
      if (guideStep === "menu" && button) delta = Math.max(delta, button.bottom - (panel - 16));
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollBy({ top: delta, behavior: reduce ? "auto" : "smooth" });
    });
    return () => cancelAnimationFrame(id);
  }, [guideStep, guideCard]);

  const closeGuide = useCallback(() => {
    adhkarGuide.markSeen();
    setGuide(null);
  }, []);

  useEffect(() => {
    setGuide(null); // switching between morning and evening drops a guide left open
    if (adhkarGuide.seen()) return;
    const id = window.setTimeout(startGuide, 600);
    return () => window.clearTimeout(id);
  }, [startGuide]);

  function tap(i: number) {
    const d = adhkar[i];
    if (done[i] >= d.count) return;
    const now = adhkarProgress.tap(collection.id, i, d.count, adhkar.length);
    // A short buzz per count, a double one when the dhikr is finished (where the device supports it).
    navigator.vibrate?.(now >= d.count ? [20, 60, 20] : 12);
    if (now >= d.count) {
      // Bring the next unfinished dhikr (in the reader's order) into view.
      const next = order.slice(order.indexOf(i) + 1).find((k) => done[k] < adhkar[k].count) ?? -1;
      if (guide?.step === "tap" && guide.i === i) {
        // The guide scrolls to it, clear of its panel.
        if (next >= 0) setGuide({ step: "next", i: next });
        else closeGuide();
        return;
      }
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (next >= 0)
        cards.current[next]?.scrollIntoView({
          behavior: reduce ? "auto" : "smooth",
          block: "center",
        });
    }
  }

  return (
    // Adhkar are Arabic, so the whole page is laid out right-to-left whatever the UI language.
    <div dir="rtl" style={{ "--hue": collection.hue } as React.CSSProperties} className="mx-auto max-w-3xl space-y-6">
      {category && <BackLink to={`/categories/${category.id}`}>{l(category.name)}</BackLink>}

      <header
        ref={header}
        className={cn(
          "tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8",
          guide?.step === "menu" && "z-50 ring-2 ring-[oklch(0.78_0.12_var(--hue))]",
        )}
      >
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_left,black,transparent_70%)] rtl:mask-[linear-gradient(to_right,black,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-4">
          <div className="min-w-0">
            <span className="tint-bg tint-fg inline-flex size-10 items-center justify-center rounded-2xl">
              <Icon className="size-5" />
            </span>
            <h1 lang="ar" className="font-adhkar mt-3 text-4xl leading-tight">
              {collection.name.ar}
            </h1>
            {!isAr && (
              <p className="mt-1 text-lg text-foreground/80">
                <span dir={uiDir}>{l(collection.name)}</span>
              </p>
            )}
            <p className="mt-4 text-sm" aria-live="polite">
              <span dir={uiDir}>
                {finished === adhkar.length ? (
                  <span className="tint-fg font-medium">{t("adhkar.allDone")}</span>
                ) : (
                  <>
                    <span className="font-medium text-foreground">
                      {t("adhkar.progress", {
                        done: num(finished),
                        total: num(adhkar.length),
                      })}
                    </span>
                    {finished === 0 && <span className="text-muted-foreground"> · {t("adhkar.hint")}</span>}
                  </>
                )}
              </span>
            </p>
            <div dir={uiDir} className="-ms-1 mt-2 flex flex-wrap items-center gap-x-3">
              {finished < adhkar.length && (
                <button
                  type="button"
                  onClick={startGuide}
                  className="inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground"
                >
                  <CircleHelp className="size-3.5" />
                  {t("adhkar.guideReplay")}
                </button>
              )}
              <button
                ref={reorderButton}
                type="button"
                onClick={() => setReordering(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-xs text-muted-foreground transition-colors hover:text-foreground",
                  guide?.step === "menu" && "tint-bg tint-fg px-2.5 py-1 ring-2 ring-[oklch(0.78_0.12_var(--hue))]",
                )}
              >
                <ArrowUpDown className="size-3.5" />
                {t("adhkar.reorder")}
              </button>
            </div>
          </div>
          {finished > 0 && (
            <button
              type="button"
              onClick={() => adhkarProgress.reset(collection.id)}
              dir={uiDir}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <RotateCcw className="size-3.5" />
              {t("adhkar.startOver")}
            </button>
          )}
        </div>
      </header>

      <ol className="space-y-3">
        {order.map((i, pos) => {
          const d = adhkar[i];
          const count = done[i];
          const complete = count >= d.count;
          // The ⇅ step lifts the header instead.
          const guided = guide?.i === i && guide.step !== "menu" ? guide.step : null;
          return (
            <li
              key={i}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className={cn(
                "scroll-mt-20 overflow-hidden rounded-3xl border bg-card transition-[opacity,border-color]",
                complete ? "opacity-50" : "hover:tint-border",
                guided && "relative z-50 ring-2 ring-[oklch(0.78_0.12_var(--hue))]",
              )}
            >
              {guided === "tap" && <TapHint />}
              {/* The whole text is the tap target, like a tasbih. */}
              <button
                type="button"
                onClick={(e) => {
                  // Selecting text to copy it shouldn't count as a tap.
                  if (window.getSelection()?.toString()) return;
                  const r = e.currentTarget.getBoundingClientRect();
                  // Keyboard presses have no pointer position; ripple from the middle.
                  const x = e.detail ? e.clientX - r.left : r.width / 2;
                  const y = e.detail ? e.clientY - r.top : r.height / 2;
                  // Big enough to reach the farthest corner.
                  const size = 2 * Math.hypot(Math.max(x, r.width - x), Math.max(y, r.height - y));
                  setRipple((p) => ({ i, x, y, size, key: (p?.key ?? 0) + 1 }));
                  tap(i);
                }}
                disabled={complete}
                aria-label={complete ? t("adhkar.done") : t("adhkar.tap", { left: num(d.count - count) })}
                className="relative isolate block w-full cursor-pointer overflow-hidden p-5 text-right transition-transform outline-none select-text focus-visible:bg-accent/40 active:scale-[0.985] disabled:cursor-default disabled:active:scale-100 sm:p-7"
              >
                {ripple?.i === i && (
                  <span
                    key={ripple.key}
                    aria-hidden
                    className="pointer-events-none absolute -z-10 animate-ripple rounded-full bg-[oklch(0.78_0.12_var(--hue)/0.18)]"
                    style={{ left: ripple.x, top: ripple.y, width: ripple.size, height: ripple.size }}
                  />
                )}
                <span className="mb-3 block text-xs font-medium text-muted-foreground tabular-nums">
                  <span dir="ltr">
                    {num(pos + 1)} / {num(adhkar.length)}
                  </span>
                </span>
                {d.intro && (
                  <span lang="ar" dir="rtl" className="font-adhkar mb-2 block text-sm text-muted-foreground sm:text-base">
                    {d.intro}
                  </span>
                )}
                <span
                  lang="ar"
                  dir="rtl"
                  className="font-adhkar block text-[1.125rem] leading-loose text-foreground sm:text-[1.25rem]"
                >
                  {d.text}
                </span>
                {d.virtue && (
                  <span
                    lang="ar"
                    dir="rtl"
                    className="mt-5 block border-s-2 tint-border ps-4 text-sm leading-relaxed text-foreground/80"
                  >
                    <span className="tint-fg font-semibold">فضله: </span>
                    {d.virtue}
                  </span>
                )}
              </button>

              <div className="relative flex min-h-12 items-center justify-between gap-3 border-t bg-white/2 px-5 py-2 text-sm sm:px-7">
                {/* Fills from the right (the page is right-to-left) with each count. */}
                {d.count > 1 && (
                  <span
                    aria-hidden
                    className="tint-solid absolute inset-x-0 -top-px h-0.5 origin-right transition-transform duration-300 ease-out"
                    style={{ transform: `scaleX(${Math.min(count / d.count, 1)})` }}
                  />
                )}
                {complete ? (
                  <span dir={uiDir} className="tint-fg inline-flex items-center gap-1.5 font-medium">
                    <Check className="size-4" />
                    {t("adhkar.done")}
                  </span>
                ) : (
                  <span dir={uiDir} className="text-muted-foreground" aria-live="polite">
                    {t("adhkar.repeat", { count: d.count })}
                    {count > 0 && (
                      <>
                        {" · "}
                        {/* Remounts on every count so it pops again. */}
                        <span
                          key={count}
                          className="tint-fg inline-block animate-bump font-medium motion-reduce:animate-none"
                        >
                          {t("adhkar.left", { left: num(d.count - count) })}
                        </span>
                      </>
                    )}
                  </span>
                )}
                <div className="-me-2 flex items-center">
                  {d.grading && (
                    <button
                      type="button"
                      onClick={() => setSource({ i, open: true })}
                      aria-label={t("grading.open")}
                      title={t("grading.open")}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <ScrollText className="size-4" />
                    </button>
                  )}
                  {count > 0 && (
                    <button
                      type="button"
                      onClick={() => adhkarProgress.reset(collection.id, i)}
                      aria-label={t("adhkar.resetOne")}
                      title={t("adhkar.resetOne")}
                      className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        <span dir={uiDir}>
          {t("watch.source")}{" "}
          <a href={collection.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
            {l(collection.source.name)}
          </a>
        </span>
      </p>

      <DhikrGrading
        grading={source ? adhkar[source.i].grading : null}
        open={!!source?.open}
        onOpenChange={(open) => setSource((s) => s && { ...s, open })}
      />

      <AdhkarReorder
        adhkar={adhkar}
        order={order}
        open={reordering}
        onOpenChange={setReordering}
        onSave={(next) => adhkarOrder.set(collection.id, next)}
      />

      {guide && (
        <AdhkarGuide
          step={guide.step}
          count={adhkar[guide.i].count}
          left={adhkar[guide.i].count - done[guide.i]}
          onNext={() => setGuide({ ...guide, step: "menu" })}
          onClose={closeGuide}
        />
      )}
    </div>
  );
}
