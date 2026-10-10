import { cn } from "cn";
import { Check, Moon, RotateCcw, Sun } from "lucide-react";
import { useRef } from "react";
import { data } from "react-router";
import { BackLink } from "~/components/back-link";
import { categoryOf } from "~/data/categories";
import { getAdhkarCollection } from "~/data/adhkar";
import { getAdhkar } from "~/data/adhkar.server";
import { adhkarProgress, useAdhkarDone } from "~/lib/adhkar-progress";
import { useLocalize } from "~/lib/localize";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const collection = getAdhkarCollection(params.collectionId);
  if (!collection) throw data(null, { status: 404 });
  return {
    collectionId: collection.id,
    title: collection.name.ar,
    adhkar: getAdhkar(collection.id),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

export default function AdhkarPage({ loaderData }: Route.ComponentProps) {
  const collection = getAdhkarCollection(loaderData.collectionId)!;
  const { adhkar } = loaderData;
  const category = categoryOf("adhkar", collection.id);
  const done = useAdhkarDone(collection.id, adhkar.length);
  const { l, t, num, isAr } = useLocalize();
  // UI-language text on this right-to-left page keeps its own direction so it isn't scrambled.
  const uiDir = isAr ? "rtl" : "ltr";
  const cards = useRef<(HTMLLIElement | null)[]>([]);
  const finished = adhkar.filter((d, i) => done[i] >= d.count).length;
  const Icon = collection.icon === "sun" ? Sun : Moon;

  function tap(i: number) {
    const d = adhkar[i];
    if (done[i] >= d.count) return;
    const now = adhkarProgress.tap(collection.id, i, d.count, adhkar.length);
    if (now >= d.count) {
      // Bring the next unfinished dhikr into view.
      const next = adhkar.findIndex((x, k) => k > i && done[k] < x.count);
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

      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8">
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
        {adhkar.map((d, i) => {
          const count = done[i];
          const complete = count >= d.count;
          return (
            <li
              key={i}
              ref={(el) => {
                cards.current[i] = el;
              }}
              className={cn(
                "overflow-hidden rounded-3xl border bg-card transition-[opacity,border-color]",
                complete ? "opacity-50" : "hover:tint-border",
              )}
            >
              {/* The whole text is the tap target, like a tasbih. */}
              <button
                type="button"
                onClick={() => {
                  // Selecting text to copy it shouldn't count as a tap.
                  if (window.getSelection()?.toString()) return;
                  tap(i);
                }}
                disabled={complete}
                aria-label={complete ? t("adhkar.done") : t("adhkar.tap", { left: num(d.count - count) })}
                className="block w-full cursor-pointer p-5 text-right transition-transform outline-none select-text focus-visible:bg-accent/40 active:scale-[0.99] disabled:cursor-default disabled:active:scale-100 sm:p-7"
              >
                <span className="mb-3 block text-xs font-medium text-muted-foreground tabular-nums">
                  <span dir="ltr">
                    {num(i + 1)} / {num(adhkar.length)}
                  </span>
                </span>
                {d.intro && (
                  <span lang="ar" dir="rtl" className="font-adhkar mb-2 block text-base text-muted-foreground">
                    {d.intro}
                  </span>
                )}
                <span lang="ar" dir="rtl" className="font-adhkar block text-[1.5rem] leading-[2.2] text-foreground">
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

              <div className="flex min-h-12 items-center justify-between gap-3 border-t bg-white/2 px-5 py-2 text-sm sm:px-7">
                {complete ? (
                  <span dir={uiDir} className="tint-fg inline-flex items-center gap-1.5 font-medium">
                    <Check className="size-4" />
                    {t("adhkar.done")}
                  </span>
                ) : (
                  <span dir={uiDir} className="text-muted-foreground" aria-live="polite">
                    {t("adhkar.repeat", { count: d.count })}
                    {count > 0 && (
                      <span className="tint-fg font-medium"> · {t("adhkar.left", { left: num(d.count - count) })}</span>
                    )}
                  </span>
                )}
                {count > 0 && (
                  <button
                    type="button"
                    onClick={() => adhkarProgress.reset(collection.id, i)}
                    aria-label={t("adhkar.resetOne")}
                    title={t("adhkar.resetOne")}
                    className="-me-2 rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    <RotateCcw className="size-4" />
                  </button>
                )}
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
    </div>
  );
}
