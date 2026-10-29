import { cn } from "cn";
import { BookOpen, Search } from "lucide-react";
import { useState } from "react";
import { data, href, Link } from "react-router";
import { BackLink } from "~/components/back-link";
import { categoryOf } from "~/data/categories";
import { getMushafText } from "~/data/mushaf.server";
import { getMushaf, mushafSource } from "~/data/mushafs";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";
import { useMushafPage } from "~/lib/mushaf-position";
import { surahMatches } from "~/lib/surah-search";
import { pageMeta } from "~/lib/meta";
import { localizer, seo } from "~/lib/meta.server";
import type { Route } from "./+types/route";

export async function loader({ params, context }: Route.LoaderArgs) {
  const mushaf = getMushaf(params.mushafId);
  if (!mushaf) throw data(null, { status: 404 });
  const text = getMushafText(mushaf.id);
  return {
    mushafId: mushaf.id,
    meta: seo(context, [localizer(context).l(mushaf.name)]),
    // Per surah: its ayah count in this riwayah and the mushaf page it opens on.
    surahs: text.map((s) => ({ ayahs: s.ayahs.length, page: s.ayahs[0].page })),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

export default function MushafPage({ loaderData }: Route.ComponentProps) {
  const mushaf = getMushaf(loaderData.mushafId)!;
  const category = categoryOf("mushaf", mushaf.id);
  const { l, t, num, isAr } = useLocalize();
  const [query, setQuery] = useState("");
  const lastPage = useMushafPage(mushaf.id);
  const shown = surahs.filter((s) => surahMatches(s, query, l(s.meaning)));

  return (
    <div style={{ "--hue": mushaf.hue } as React.CSSProperties} className="mx-auto max-w-3xl space-y-6">
      {category && <BackLink to={`/categories/${category.id}`}>{l(category.name)}</BackLink>}

      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8 rtl:bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)]">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_right,black,transparent_70%)] rtl:mask-[linear-gradient(to_left,black,transparent_70%)]" />
        <div className="relative">
          <h1 className="text-3xl font-semibold tracking-tight">{l(mushaf.name)}</h1>
          {!isAr && (
            <p lang="ar" className="font-arabic mt-1 text-xl text-muted-foreground">
              {mushaf.name.ar}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">{l(mushaf.description)}</p>
          <p className="mt-2 text-sm text-muted-foreground">
            <span className="whitespace-nowrap">{t("quran.surahs", { count: surahs.length })}</span> ·{" "}
            <span className="whitespace-nowrap">{t("quran.ayahs", { count: mushaf.ayahs })}</span> ·{" "}
            <span className="whitespace-nowrap">{t("mushaf.pageCount", { count: mushaf.pages })}</span>
          </p>
          <Link
            to={href("/mushaf/:mushafId/page/:page", { mushafId: mushaf.id, page: String(lastPage ?? 1) })}
            className="mt-5 inline-flex items-center gap-2 rounded-full bg-[oklch(0.9_0.06_var(--hue))] px-4 py-2 text-sm font-medium text-[oklch(0.22_0.05_var(--hue))] transition-[scale] active:scale-95"
          >
            <BookOpen className="size-4" />
            {lastPage ? t("mushaf.continue", { n: num(lastPage) }) : t("mushaf.open")}
          </Link>
        </div>
      </header>

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
              const info = loaderData.surahs[s.n - 1];
              return (
                <li key={s.n}>
                  <Link
                    to={`${href("/mushaf/:mushafId/page/:page", { mushafId: mushaf.id, page: String(info.page) })}#surah-${s.n}`}
                    className="flex items-center gap-3 px-3 py-3 transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/60 sm:px-4"
                  >
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground tabular-nums">
                      {num(s.n)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-baseline justify-between gap-3">
                        <span className={cn("truncate font-medium", isAr && "font-arabic text-lg")}>
                          {isAr ? s.name : s.translit}
                        </span>
                        {!isAr && (
                          <span lang="ar" dir="rtl" className="font-arabic shrink-0 text-lg leading-none">
                            {s.name}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-baseline justify-between gap-3 text-xs text-muted-foreground">
                        <span className="truncate">
                          {!isAr && <>{l(s.meaning)} · </>}
                          {t("quran.ayahs", { count: info.ayahs })}
                          <span className="max-sm:hidden"> · {t(`quran.${s.revelation}`)}</span>
                        </span>
                        <span className="shrink-0 tabular-nums">{t("mushaf.page", { n: num(info.page) })}</span>
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <p className="pb-4 text-center text-xs text-muted-foreground">
        {t("watch.source")}{" "}
        <a href={mushafSource.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          {l(mushafSource.name)}
        </a>
      </p>
    </div>
  );
}
