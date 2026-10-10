import { cn } from "cn";
import { AudioLines, CalendarDays, Clock, Headphones, Heart, Layers, Moon, Play, Sun } from "lucide-react";
import { data, href, Link, useSearchParams } from "react-router";
import { useClock } from "~/components/audio-lesson";
import { FavoriteButton } from "~/components/favorite-button";
import { ProgrammeToggle } from "~/components/programme-toggle";
import { ProgressRing } from "~/components/progress-ring";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getAdhkarCollection } from "~/data/adhkar";
import { getAdhkar } from "~/data/adhkar.server";
import { getCategory, itemInfo } from "~/data/categories";
import { countBooks, getSubject, type Subject } from "~/data/curriculum";
import { seriesForBook } from "~/data/explanations";
import { getReciter, type Reciter } from "~/data/reciters";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";
import { useAdhkarDone } from "~/lib/adhkar-progress";
import { player, usePlayer } from "~/lib/player";
import { quranFavorites, useQuranFavorites } from "~/lib/quran-favorites";
import { surahTrackId, useSurahTrack } from "~/lib/surah-track";
import { usePreferences } from "~/lib/preferences";
import { useProgress } from "~/lib/progress";
import { subjectProgress } from "~/lib/schedule";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategory(params.categoryId);
  if (!category) throw data(null, { status: 404 });
  // Each adhkār collection's repetition counts, for its "done today" figure.
  const adhkarCounts = Object.fromEntries(
    category.items.filter((i) => i.kind === "adhkar").map((i) => [i.id, getAdhkar(i.id as "sabah" | "masaa").map((d) => d.count)]),
  );
  return { categoryId: category.id, title: category.name.ar, adhkarCounts };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

/** Books of a subject that have at least one recorded explanation in the app. */
function booksWithAudio(subject: Subject) {
  let n = 0;
  for (const g of subject.groups)
    for (const e of g.entries) for (const b of e.options) if (seriesForBook(b.id).length) n++;
  return n;
}

function SubjectCard({ subject }: { subject: Subject }) {
  const p = useProgress();
  const { l, t, num, isAr } = useLocalize();
  const sp = subjectProgress(subject, p);
  return (
    <Link
      to={itemInfo({ kind: "subject", id: subject.id }).to}
      style={{ "--hue": subject.hue } as React.CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <ProgressRing value={sp.pct} className="tint-fg">
        <span className="text-foreground tabular-nums">{num(sp.pct)}%</span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{l(subject.name)}</p>
        {!isAr && (
          <p lang="ar" className="font-arabic text-sm text-muted-foreground">
            {subject.name.ar}
          </p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3" />
            {t("program.books", { count: countBooks(subject) })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="size-3" />
            {t("category.withAudio", { count: num(booksWithAudio(subject)) })}
          </span>
        </p>
      </div>
    </Link>
  );
}

function AdhkarCard({ id, counts }: { id: string; counts: number[] }) {
  const collection = getAdhkarCollection(id)!;
  const done = useAdhkarDone(id, counts.length);
  const { l, t, num, isAr } = useLocalize();
  const finished = counts.filter((c, i) => done[i] >= c).length;
  const pct = counts.length ? Math.round((finished / counts.length) * 100) : 0;
  const Icon = collection.icon === "sun" ? Sun : Moon;
  return (
    <Link
      to={itemInfo({ kind: "adhkar", id }).to}
      style={{ "--hue": collection.hue } as React.CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <ProgressRing value={pct} className="tint-fg">
        <Icon className="size-5 text-foreground" />
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{l(collection.name)}</p>
        {!isAr && (
          <p lang="ar" className="font-arabic text-sm text-muted-foreground">
            {collection.name.ar}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("adhkar.progress", { done: num(finished), total: num(counts.length) })}
        </p>
      </div>
    </Link>
  );
}

function ReciterCard({ id }: { id: string }) {
  const reciter = getReciter(id)!;
  const { l, t, num, duration, isAr } = useLocalize();
  const minutes = Math.round(reciter.seconds.reduce((a, b) => a + b, 0) / 60);
  return (
    <Link
      to={itemInfo({ kind: "reciter", id }).to}
      style={{ "--hue": reciter.hue } as React.CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <ScholarAvatar scholar={reciter} className="size-14 text-2xl ring-0" />
      <div className="min-w-0 flex-1">
        <p className="font-medium">{l(reciter.name)}</p>
        {!isAr && (
          <p lang="ar" className="font-arabic text-sm text-muted-foreground">
            {reciter.name.ar}
          </p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3" />
            {t("quran.surahs", { count: reciter.seconds.length })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock className="size-3" />
            {duration(minutes)}
          </span>
          <span>{l(reciter.riwayah)}</span>
        </p>
      </div>
    </Link>
  );
}

/** One reciter's favourite surahs, playable in place; "Play all" runs through them in order. */
function FavoriteGroup({ reciter, list }: { reciter: Reciter; list: number[] }) {
  const s = usePlayer();
  const surahTrack = useSurahTrack();
  const clock = useClock();
  const { l, t, num, isAr } = useLocalize();
  // After a favourite ends, the next one (read then, so later changes count).
  const nextFavorite = (n: number) => quranFavorites.of(reciter.id).find((x) => x > n);
  const play = (n: number) => player.play(surahTrack(reciter, n, nextFavorite));

  return (
    <section style={{ "--hue": reciter.hue } as React.CSSProperties} className="overflow-hidden rounded-2xl border bg-card">
      <header className="flex items-center gap-3 border-b p-4">
        <ScholarAvatar scholar={reciter} className="size-11 text-xl ring-0" />
        <div className="min-w-0 flex-1">
          <p className="truncate font-medium">{l(reciter.name)}</p>
          <p className="text-xs text-muted-foreground">
            {t("quran.surahs", { count: list.length })} ·{" "}
            <Link to={itemInfo({ kind: "reciter", id: reciter.id }).to} className="text-primary hover:underline">
              {t("quran.allSurahs")}
            </Link>
          </p>
        </div>
        <button
          type="button"
          onClick={() => play(list[0])}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-[oklch(0.9_0.06_var(--hue))] px-3.5 py-2 text-sm font-medium text-[oklch(0.22_0.05_var(--hue))] transition-[scale] active:scale-95"
        >
          <Play className="size-3.5 fill-current" />
          {t("quran.playAll")}
        </button>
      </header>
      <ol className="divide-y">
        {list.map((n) => {
          const surah = surahs[n - 1];
          const active = s.track?.id === surahTrackId(reciter.id, n);
          const name = isAr ? surah.name : surah.translit;
          return (
            <li key={n} className={cn("flex items-center transition-colors", active ? "tint-bg" : "hover:bg-accent/50")}>
              <button
                type="button"
                onClick={() => (active ? player.toggle() : play(n))}
                aria-current={active ? "true" : undefined}
                aria-label={`${active && s.playing ? t("watch.pause") : t("watch.play")}: ${name}`}
                className="flex min-w-0 flex-1 items-center gap-3 py-3 ps-4 text-start outline-none focus-visible:bg-accent/60"
              >
                <span
                  className={cn(
                    "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums",
                    active ? "tint-border tint-fg" : "text-muted-foreground",
                  )}
                >
                  {active && s.playing ? (
                    <AudioLines className="size-4" />
                  ) : active ? (
                    <Play className="size-3.5 fill-current" />
                  ) : (
                    num(n)
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-3">
                    <span className={cn("truncate font-medium", isAr && "font-arabic text-lg", active && "tint-fg")}>
                      {name}
                    </span>
                    {!isAr && (
                      <span lang="ar" dir="rtl" className="font-arabic shrink-0 text-lg leading-none">
                        {surah.name}
                      </span>
                    )}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {!isAr && <>{l(surah.meaning)} · </>}
                    {t("quran.ayahs", { count: surah.ayahs })}
                  </span>
                </span>
                <span dir="ltr" className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {clock(reciter.seconds[n - 1])}
                </span>
              </button>
              <FavoriteButton reciterId={reciter.id} surah={n} name={name} className="mx-1 size-10 sm:me-2" />
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/** Favourite surahs grouped by reciter (in the category's reciter order). */
function QuranFavorites({ reciterIds }: { reciterIds: string[] }) {
  const favorites = useQuranFavorites();
  const { t } = useLocalize();
  const groups = reciterIds.filter((id) => favorites[id]?.length).map((id) => getReciter(id)!);
  if (!groups.length) {
    return (
      <div className="flex flex-col items-center rounded-2xl border border-dashed p-10 text-center">
        <span className="flex size-12 items-center justify-center rounded-full bg-rose-400/10 text-rose-400">
          <Heart className="size-5" />
        </span>
        <p className="mt-4 font-medium">{t("quran.favoritesEmpty")}</p>
        <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("quran.favoritesEmptyHint")}</p>
      </div>
    );
  }
  return (
    <div className="grid items-start gap-4 xl:grid-cols-2">
      {groups.map((r) => (
        <FavoriteGroup key={r.id} reciter={r} list={favorites[r.id]} />
      ))}
    </div>
  );
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const category = getCategory(loaderData.categoryId)!;
  const { programme } = usePreferences();
  const { l, t, num, isAr } = useLocalize();
  const recitersOnly = category.items.every((i) => i.kind === "reciter");
  const favorites = useQuranFavorites();
  const favoriteCount = Object.values(favorites).reduce((a, list) => a + list.length, 0);
  // The Qur'an page's tab lives in the URL (?tab=favorites) so back/forward and links keep it.
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "favorites" ? "favorites" : "items";

  const grid = (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
      {category.items.map((item) =>
        item.kind === "subject" ? (
          <SubjectCard key={item.id} subject={getSubject(item.id)!} />
        ) : item.kind === "reciter" ? (
          <ReciterCard key={item.id} id={item.id} />
        ) : (
          <AdhkarCard key={item.id} id={item.id} counts={loaderData.adhkarCounts[item.id] ?? []} />
        ),
      )}
    </div>
  );

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[radial-gradient(70%_100%_at_100%_0%,black,transparent)]" />
        <div className="relative max-w-2xl">
          <p className="text-sm text-gold">{t("category.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{l(category.name)}</h1>
          {!isAr && (
            <p lang="ar" className="font-arabic mt-3 text-xl text-muted-foreground">
              {category.name.ar}
            </p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{l(category.description)}</p>
        </div>
      </header>

      {recitersOnly ? (
        <Tabs
          value={tab}
          onValueChange={(v) =>
            setParams(v === "favorites" ? { tab: "favorites" } : {}, { replace: true, preventScrollReset: true })
          }
          dir={isAr ? "rtl" : "ltr"}
        >
          <TabsList>
            <TabsTrigger value="items">{t("category.reciters")}</TabsTrigger>
            <TabsTrigger value="favorites">
              <Heart className={cn(favoriteCount > 0 && "fill-rose-400 text-rose-400")} />
              {t("quran.favoritesTab")}
              {favoriteCount > 0 && <span className="text-xs text-muted-foreground tabular-nums">{num(favoriteCount)}</span>}
            </TabsTrigger>
          </TabsList>
          <TabsContent value="items" className="mt-4">
            {grid}
          </TabsContent>
          <TabsContent value="favorites" className="mt-4">
            <QuranFavorites reciterIds={category.items.map((i) => i.id)} />
          </TabsContent>
        </Tabs>
      ) : (
        <section>
          <h2 className="mb-4 text-lg font-semibold">
            {category.items.every((i) => i.kind === "subject") ? t("category.sciences") : t("category.pages")}
          </h2>
          {grid}
        </section>
      )}

      {category.items.some((i) => i.kind === "subject") && (
      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("category.programmeBody")}</p>
          {programme && (
            <Link to="/" className="mt-1 inline-block text-sm text-primary hover:underline">
              {t("category.openProgramme")}
            </Link>
          )}
        </div>
        <ProgrammeToggle hint={false} className="sm:w-56" />
      </section>
      )}
    </div>
  );
}
