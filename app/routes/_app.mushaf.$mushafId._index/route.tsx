import { cn } from "cn";
import { BookOpen } from "lucide-react";
import { useState } from "react";
import { data, href, Link } from "react-router";
import { BackLink } from "~/components/back-link";
import { QuranSearchInput, QuranSearchResults } from "~/components/quran-search";
import { RiwayahSwitch } from "~/components/riwayah-switch";
import { categoryOf, itemInfo } from "~/data/categories";
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
    meta: seo(context, [localizer(context).l(categoryOf("mushaf", mushaf.id)!.name), localizer(context).l(mushaf.short)]),
    // Per surah: its ayah count in this riwayah and the mushaf page it opens on.
    surahs: text.map((s) => ({ ayahs: s.ayahs.length, page: s.ayahs[0].page })),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

export default function MushafPage({ loaderData }: Route.ComponentProps) {
  const mushaf = getMushaf(loaderData.mushafId)!;
  // Tafsīr, under the Qur'an (whose page the back link leads to: Tafsīr's own opens this one).
  const section = categoryOf("mushaf", mushaf.id)!;
  const parent = categoryOf("category", section.id);
  const { l, t, num, isAr } = useLocalize();
  const [query, setQuery] = useState("");
  const lastPage = useMushafPage(mushaf.id);
  const shown = surahs.filter((s) => surahMatches(s, query, l(s.meaning)));

  return (
    <div style={{ "--hue": mushaf.hue } as React.CSSProperties} className="mx-auto max-w-3xl space-y-6">
      {parent && <BackLink to={itemInfo({ kind: "category", id: parent.id }).to}>{l(parent.name)}</BackLink>}

      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8 rtl:bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)]">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_right,black,transparent_70%)] rtl:mask-[linear-gradient(to_left,black,transparent_70%)]" />
        <div className="relative">
          <div className="flex items-start justify-between gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">{l(section.name)}</h1>
            <RiwayahSwitch current={mushaf.id} to={(id) => href("/mushaf/:mushafId", { mushafId: id })} />
          </div>
          {!isAr && (
            <p lang="ar" className="font-arabic mt-1 text-xl text-muted-foreground">
              {section.name.ar}
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
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
        {/* Searches the whole Qur'an: an ayah (2:255), a page, or words; the surahs it matches stay in the list. */}
        <QuranSearchInput mushaf={mushaf} value={query} onChange={setQuery} />
        {query.trim() && (
          <QuranSearchResults
            mushaf={mushaf}
            query={query}
            withSurahs={false}
            showNone={shown.length === 0}
            className="overflow-hidden rounded-2xl border bg-card"
          />
        )}

        {shown.length === 0 ? null : (
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
