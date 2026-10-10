import { cn } from "cn";
import { AudioLines, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useRef, useState } from "react";
import { data, useSearchParams } from "react-router";
import { AudioLesson, useClock } from "~/components/audio-lesson";
import { BackLink } from "~/components/back-link";
import { FavoriteButton } from "~/components/favorite-button";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { categoryOf } from "~/data/categories";
import { getReciter } from "~/data/reciters";
import { type Surah, surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";
import { player, usePlayer } from "~/lib/player";
import { surahFromTrack, useSurahTrack } from "~/lib/surah-track";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const reciter = getReciter(params.reciterId);
  if (!reciter) throw data(null, { status: 404 });
  return { reciterId: reciter.id, title: reciter.name.ar };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

/** Arabic without diacritics and with one form of alif, tāʾ marbūṭah and yāʾ, so "الاعلى" finds "الأعلى". */
function plainArabic(s: string) {
  return s
    .replace(/[ً-ْٰـ]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي");
}

function plainLatin(s: string) {
  return s
    .normalize("NFD")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function matches(surah: Surah, query: string, meaning: string) {
  const q = query.trim().replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x660));
  if (!q) return true;
  if (/^\d+$/.test(q)) return String(surah.n).startsWith(q);
  const ar = plainArabic(q).replace(/^سوره\s*/, "");
  const latin = plainLatin(q);
  return (
    (ar.length > 0 && plainArabic(surah.name).includes(ar)) ||
    (latin.length > 0 && (plainLatin(surah.translit).includes(latin) || plainLatin(meaning).includes(latin)))
  );
}

export default function ReciterPage({ loaderData }: Route.ComponentProps) {
  const reciter = getReciter(loaderData.reciterId)!;
  const category = categoryOf("reciter", reciter.id);
  const { l, t, num, duration, isAr } = useLocalize();
  const clock = useClock();
  const [params, setParams] = useSearchParams();
  const requested = Number(params.get("surah"));
  // A surah of this reciter that's already playing (it may have moved on by itself) wins over the URL.
  const playingHere = surahFromTrack(reciter.id, usePlayer().track?.id);
  const current =
    playingHere || (Number.isInteger(requested) && requested >= 1 && requested <= surahs.length ? requested : 1);
  const [query, setQuery] = useState("");
  const playerBox = useRef<HTMLDivElement>(null);
  const totalMinutes = Math.round(reciter.seconds.reduce((a, b) => a + b, 0) / 60);
  const shown = surahs.filter((s) => matches(s, query, l(s.meaning)));

  // Recites on through the mushaf when a surah ends.
  const surahTrack = useSurahTrack();
  const track = (n: number) => surahTrack(reciter, n);

  function play(n: number) {
    player.play(track(n));
    setParams({ surah: String(n) }, { replace: true, preventScrollReset: true });
    // Below lg the player sits above the list, so bring it back into view.
    if (!window.matchMedia("(min-width: 1024px)").matches) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      playerBox.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    }
  }

  return (
    <div style={{ "--hue": reciter.hue } as React.CSSProperties} className="space-y-6">
      {category && <BackLink to={`/categories/${category.id}`}>{l(category.name)}</BackLink>}

      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8 rtl:bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)]">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_right,black,transparent_70%)] rtl:mask-[linear-gradient(to_left,black,transparent_70%)]" />
        <div className="relative flex items-center gap-5">
          <ScholarAvatar scholar={reciter} className="size-16 text-3xl ring-0" />
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight">{l(reciter.name)}</h1>
            {!isAr && (
              <p lang="ar" className="font-arabic mt-1 text-xl text-muted-foreground">
                {reciter.name.ar}
              </p>
            )}
            <p className="mt-2 text-sm text-muted-foreground">
              {/* Keep each fact whole when the line wraps (e.g. "114" with "سورة"). */}
              <span className="whitespace-nowrap">{l(reciter.riwayah)}</span> ·{" "}
              <span className="whitespace-nowrap">{t("quran.surahs", { count: reciter.seconds.length })}</span> ·{" "}
              <span className="whitespace-nowrap">{duration(totalMinutes)}</span>
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-start">
        <div ref={playerBox} className="scroll-mt-20 space-y-3 lg:sticky lg:top-22">
          <AudioLesson key={current} track={track(current)} />
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={current === 1}
              onClick={() => play(current - 1)}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              <ChevronLeft className="size-4 rtl:rotate-180" />
              {t("quran.prev")}
            </button>
            <p className="min-w-0 flex-1 truncate text-center text-xs text-muted-foreground max-sm:invisible">{t("quran.playsOn")}</p>
            <button
              type="button"
              disabled={current === surahs.length}
              onClick={() => play(current + 1)}
              className="inline-flex items-center gap-1 rounded-full border bg-card px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:pointer-events-none disabled:opacity-40"
            >
              {t("quran.next")}
              <ChevronRight className="size-4 rtl:rotate-180" />
            </button>
          </div>
          <p className="text-center text-xs text-muted-foreground">
            {t("watch.source")}{" "}
            <a href={reciter.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
              {l(reciter.source.name)}
            </a>
            {reciter.photo && (
              <>
                {" · "}
                {t("quran.photo")}{" "}
                <a href={reciter.photo.url} target="_blank" rel="noreferrer" className="hover:underline">
                  <bdi>{reciter.photo.author}</bdi>, {reciter.photo.license}
                </a>
              </>
            )}
          </p>
        </div>

        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">{t("quran.surahsTitle")}</h2>
            <span className="text-sm text-muted-foreground tabular-nums">{num(surahs.length)}</span>
          </div>
          <label className="flex cursor-text items-center gap-2 rounded-xl border bg-card px-3 focus-within:ring-2 focus-within:ring-ring/50">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.currentTarget.value)}
              placeholder={t("quran.search")}
              aria-label={t("quran.search")}
              className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </label>

          {shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">
              {t("quran.noMatch", { q: query.trim() })}
            </p>
          ) : (
            <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
              {shown.map((s) => {
                const active = s.n === current;
                return (
                  <li
                    key={s.n}
                    className={cn("flex items-center transition-colors", active ? "tint-bg" : "hover:bg-accent/50")}
                  >
                    <button
                      type="button"
                      onClick={() => play(s.n)}
                      aria-current={active ? "true" : undefined}
                      className="flex min-w-0 flex-1 items-center gap-3 py-3 ps-3 text-start outline-none focus-visible:bg-accent/60 sm:ps-4"
                    >
                      <span
                        className={cn(
                          "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                          active ? "tint-border tint-fg" : "text-muted-foreground",
                        )}
                      >
                        {active ? <AudioLines className="size-4" /> : num(s.n)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-baseline justify-between gap-3">
                          <span className={cn("truncate font-medium", isAr && "font-arabic text-lg", active && "tint-fg")}>
                            {isAr ? s.name : s.translit}
                          </span>
                          {!isAr && (
                            <span lang="ar" dir="rtl" className="font-arabic shrink-0 text-lg leading-none">
                              {s.name}
                            </span>
                          )}
                        </span>
                        <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                          {!isAr && <>{l(s.meaning)} · </>}
                          {t("quran.ayahs", { count: s.ayahs })}
                          {/* Too long for a phone row alongside the meaning; shown from sm up. */}
                          <span className="max-sm:hidden"> · {t(`quran.${s.revelation}`)}</span>
                        </span>
                      </span>
                      <span dir="ltr" className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {clock(reciter.seconds[s.n - 1])}
                      </span>
                    </button>
                    <FavoriteButton
                      reciterId={reciter.id}
                      surah={s.n}
                      name={isAr ? s.name : s.translit}
                      className="mx-1 size-10 sm:me-2"
                    />
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
