import { cn } from "cn";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { data, href, Link, useLocation, useNavigate, useNavigation } from "react-router";
import { AyahActions, type SelectedAyah } from "~/components/ayah-actions";
import { BackLink } from "~/components/back-link";
import { QuranSearchDialog } from "~/components/quran-search";
import { getPage, pageCount } from "~/data/mushaf.server";
import { getTafsir } from "~/data/tafsir.server";
import { getMushaf, mushafSource, type TafsirPart, tafsirs } from "~/data/mushafs";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";
import { mushafPosition } from "~/lib/mushaf-position";
import { pageMeta } from "~/lib/meta";
import { localizer, seo } from "~/lib/meta.server";
import type { Route } from "./+types/route";

export async function loader({ params, context }: Route.LoaderArgs) {
  const mushaf = getMushaf(params.mushafId);
  const page = Number(params.page);
  const sections = mushaf && Number.isInteger(page) && page >= 1 ? getPage(mushaf.id, page) : undefined;
  if (!mushaf || !sections) throw data(null, { status: 404 });
  const { l, num, t } = localizer(context);
  // The short in-app tafsirs of each ayah on the page (by "surah:ayah", then tafsir), ready for a tap.
  const tafsir: Record<string, Record<string, TafsirPart[]>> = {};
  for (const s of sections)
    for (const a of s.ayahs)
      tafsir[`${s.surah}:${a.n}`] = Object.fromEntries(
        tafsirs.filter((x) => x.preload).map((x) => [x.id, getTafsir(x.id, s.surah, a.hafsAyahs)]),
      );
  return {
    mushafId: mushaf.id,
    page,
    pages: pageCount(mushaf.id),
    sections,
    tafsir,
    meta: seo(context, [`${surahs[sections[0].surah - 1].name} · ${t("mushaf.page", { n: num(page) })}`, l(mushaf.name)]),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

/**
 * The mushaf's own furniture (header, page and ayah numbers) is Arabic whatever the UI language, but
 * its numbers follow it: Arabic digits in the Arabic UI, Western ones (as in Algerian mushafs) otherwise.
 */
const mushafNumber = (n: number, isAr: boolean) => (isAr ? n.toLocaleString("ar-EG") : String(n));

/**
 * An ayah mark around a number in Western digits. The font only draws its mark around Arabic digits,
 * so this is its empty mark (U+06DD) with the number centred over the drawn mark: at line-height 1 the
 * mark's box runs from 0.793em above the baseline to 0.207em below, and the glyph's bounds within it
 * (from the font file) are 0.02–0.738em across and 0.107–0.998em down.
 */
function AyahMark({ n }: { n: number }) {
  return (
    <>
      &nbsp;
      <span className="relative inline-block leading-none">
        ۝
        <span className="absolute top-[0.107em] left-[0.02em] grid h-[0.891em] w-[0.718em] place-items-center">
          <span className={cn("font-sans leading-none font-semibold tracking-tight", n > 99 ? "text-[0.3em]" : "text-[0.36em]")}>
            {n}
          </span>
        </span>
      </span>
    </>
  );
}

/** An ayah's text and its closing number (the non-breaking space and digits its font draws as the ayah mark). */
const AYAH_NUMBER = /^([\s\S]*?)( ?[٠-٩]+)$/;

/** Below lg the page fills the screen, so its text is sized to fit the frame instead of scrolling. */
const PHONE = "(max-width: 1023.98px)";

/**
 * Sizes the page's text (in px, everything inside scales with it in em) to the largest that still
 * fits its frame, between 10 and 30, so the page never scrolls; only a screen too short for it even
 * at 10px (a phone on its side) lets it scroll rather than cut the text. Above lg it clears the size
 * and the page keeps its CSS one.
 */
function useFitToFrame(frame: React.RefObject<HTMLElement | null>, text: React.RefObject<HTMLElement | null>, key: unknown) {
  useLayoutEffect(() => {
    const box = frame.current;
    const el = text.current;
    if (!box || !el) return;
    const phone = window.matchMedia(PHONE);
    const fit = () => {
      if (!phone.matches) {
        el.style.fontSize = "";
        box.style.overflowY = "";
        return;
      }
      const s = getComputedStyle(box);
      const room = box.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
      // Exact heights with a pixel to spare: a rounded one can leave a fraction over, enough to scroll.
      const fits = () => el.getBoundingClientRect().height <= room - 1;
      let lo = 10;
      let hi = 30;
      for (let i = 0; i < 10; i++) {
        const mid = (lo + hi) / 2;
        el.style.fontSize = `${mid}px`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
      box.style.overflowY = fits() ? "hidden" : "auto";
    };
    fit();
    // Again once the mushaf font has loaded (its metrics differ from the fallback's), and on resize/rotation.
    document.fonts?.ready.then(fit);
    const ro = new ResizeObserver(fit);
    ro.observe(box);
    phone.addEventListener("change", fit);
    return () => {
      ro.disconnect();
      phone.removeEventListener("change", fit);
    };
  }, [frame, text, key]);
}

type Turn = "next" | "prev";

export default function MushafPageView({ loaderData }: Route.ComponentProps) {
  const mushaf = getMushaf(loaderData.mushafId)!;
  const { page, pages, sections, tafsir } = loaderData;
  const { l, t, num, isAr } = useLocalize();
  const uiDir = isAr ? "rtl" : "ltr";
  const navigate = useNavigate();
  const location = useLocation();
  // Which way the last turn went, so the new page slides in from the side it was turned from.
  const turn = (location.state as { turn?: Turn } | null)?.turn;
  // The ayah a search (or a link) opened the page at, lit up for a moment: #ayah-<surah>-<n>. Read
  // once in the browser, since the server never sees the hash (its HTML would differ).
  const [target, setTarget] = useState<{ surah: number; n: number; visit: string } | null>(null);
  const [searching, setSearching] = useState(false);
  useEffect(() => {
    const m = location.hash.match(/^#ayah-(\d+)-(\d+)$/);
    setTarget(m ? { surah: Number(m[1]), n: Number(m[2]), visit: location.key } : null);
    // On wide screens the page scrolls: bring the ayah to the middle (a phone's page always fits).
    if (m && !window.matchMedia(PHONE).matches)
      document.getElementById(location.hash.slice(1))?.scrollIntoView({ block: "center", behavior: "smooth" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.key]);
  const touch = useRef<{ x: number; y: number } | null>(null);
  const frame = useRef<HTMLDivElement>(null);
  const text = useRef<HTMLDivElement>(null);
  useFitToFrame(frame, text, page);

  const to = (n: number) => href("/mushaf/:mushafId/page/:page", { mushafId: mushaf.id, page: String(n) });
  const back = href("/mushaf/:mushafId", { mushafId: mushaf.id });
  const prev = page > 1 ? page - 1 : null;
  const next = page < pages ? page + 1 : null;
  const first = sections[0];
  const surahName = `سورة ${surahs[first.surah - 1].name}`;
  const juz = `الجزء ${mushafNumber(first.ayahs[0].juz, isAr)}`;

  useEffect(() => mushafPosition.set(mushaf.id, page), [mushaf.id, page]);

  // The tapped ayah, kept with its page so turning the page drops it; and which edge its panel docks
  // to on a phone (away from the ayah, so the panel never covers it).
  const [selection, setSelection] = useState<{
    page: number;
    ayah: SelectedAyah;
    side: "top" | "bottom";
    anchor: { top: number; bottom: number };
  } | null>(null);
  const selected = selection?.page === page ? selection.ayah : null;
  const closeAyah = useCallback(() => setSelection(null), []);
  function pick(ayah: SelectedAyah, el: HTMLElement) {
    // Selecting words to copy them isn't a tap on the ayah.
    if (window.getSelection()?.toString()) return;
    if (selected?.surah === ayah.surah && selected.n === ayah.n) return setSelection(null);
    const r = el.getBoundingClientRect();
    setSelection({
      page,
      ayah,
      side: r.top + r.height / 2 > window.innerHeight * 0.55 ? "top" : "bottom",
      anchor: { top: r.top, bottom: r.bottom },
    });
  }

  // Like a printed mushaf, which opens right to left: the next page lies to the left.
  const turnTo = useRef<(t: Turn) => void>(null);
  const loading = useNavigation().state !== "idle";
  turnTo.current = (dir) => {
    // Until the next page has rendered, prev/next still describe this one, so a quick second press would skip.
    if (loading) return;
    const n = dir === "next" ? next : prev;
    if (n) navigate(to(n), { state: { turn: dir } });
  };
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return;
      if ((e.target as HTMLElement).closest("input, textarea, select, [contenteditable], [role=dialog]")) return;
      if (e.key === "ArrowLeft") turnTo.current?.("next");
      else if (e.key === "ArrowRight") turnTo.current?.("prev");
      else if (e.key === "/") {
        e.preventDefault();
        setSearching(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  /** Previous/next page: a labelled pill on wide screens, a round icon button on phones. */
  const pageLink = (n: number | null, dir: Turn, compact: boolean) => {
    const Icon = dir === "next" ? ChevronLeft : ChevronRight;
    const label = t(dir === "next" ? "mushaf.nextPage" : "mushaf.prevPage");
    const className = cn(
      "inline-flex items-center gap-1.5 rounded-full border bg-card text-sm whitespace-nowrap transition-colors hover:bg-accent/60 aria-disabled:pointer-events-none aria-disabled:opacity-30",
      compact ? "size-10 justify-center" : "px-4 py-2.5",
    );
    const body = (
      <>
        {dir === "prev" && <Icon className="size-4" />}
        {compact ? <span className="sr-only">{label}</span> : <span dir={uiDir}>{label}</span>}
        {dir === "next" && <Icon className="size-4" />}
      </>
    );
    return n ? (
      <Link to={to(n)} state={{ turn: dir }} prefetch="viewport" aria-label={compact ? label : undefined} className={className}>
        {body}
      </Link>
    ) : (
      <span aria-disabled className={className}>
        {body}
      </span>
    );
  };

  return (
    <div
      style={{ "--hue": mushaf.hue } as React.CSSProperties}
      className={cn(
        "mx-auto max-w-2xl space-y-4",
        // On phones the page is the whole screen, over the app's header and tab bar.
        "max-lg:fixed max-lg:inset-0 max-lg:z-40 max-lg:flex max-lg:max-w-none max-lg:flex-col max-lg:gap-2 max-lg:space-y-0 max-lg:bg-background max-lg:px-3 max-lg:pt-[max(env(safe-area-inset-top),0.5rem)] max-lg:pb-[max(env(safe-area-inset-bottom),0.5rem)]",
      )}
    >
      <div className="flex items-center justify-between gap-3 max-lg:hidden">
        <BackLink to={back}>{l(mushaf.name)}</BackLink>
        <button
          type="button"
          onClick={() => setSearching(true)}
          className="inline-flex items-center gap-2 rounded-full border bg-card/60 py-1.5 ps-3 pe-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-4" />
          {t("search.button")}
          <kbd className="rounded border px-1.5 font-sans text-[0.7rem] leading-5">/</kbd>
        </button>
      </div>

      {/* Phone top bar: back, the running head on one line, then search. */}
      <div className="flex h-10 shrink-0 items-center gap-1 lg:hidden">
        <Link
          to={back}
          aria-label={`${t("nav.back")}: ${l(mushaf.name)}`}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ChevronLeft className="size-5 rtl:rotate-180" />
        </Link>
        <p lang="ar" dir="rtl" className="font-arabic flex min-w-0 flex-1 justify-between gap-3 px-1 text-sm text-muted-foreground">
          <span className="truncate">{surahName}</span>
          <span className="shrink-0">{juz}</span>
        </p>
        <button
          type="button"
          onClick={() => setSearching(true)}
          aria-label={t("search.button")}
          className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <Search className="size-5" />
        </button>
      </div>
      <QuranSearchDialog mushaf={mushaf} open={searching} onOpenChange={setSearching} />

      <article
        key={page}
        lang="ar"
        dir="rtl"
        onTouchStart={(e) => {
          touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }}
        onTouchEnd={(e) => {
          const start = touch.current;
          touch.current = null;
          if (!start || window.getSelection()?.toString()) return;
          const dx = e.changedTouches[0].clientX - start.x;
          const dy = e.changedTouches[0].clientY - start.y;
          // A clear sideways swipe: pulling the page to the right brings the next one, as in a mushaf.
          if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.5) return;
          turnTo.current?.(dx > 0 ? "next" : "prev");
        }}
        className={cn(
          "duration-300 animate-in fade-in motion-reduce:animate-none max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col",
          turn === "next" && "slide-in-from-left-8",
          turn === "prev" && "slide-in-from-right-8",
        )}
      >
        {/* Running head, as in the printed mushaf: the surah on one side, the juz on the other. */}
        <header className="font-arabic flex items-baseline justify-between px-2 pb-2 text-sm text-muted-foreground max-lg:hidden">
          <span>{surahName}</span>
          <span>{juz}</span>
        </header>

        <div className="tint-border rounded-[1.75rem] border-2 bg-card p-1.5 shadow-[0_20px_60px_-30px_oklch(0.6_0.1_var(--hue)/0.35)] max-lg:flex max-lg:min-h-0 max-lg:flex-1 max-lg:flex-col max-lg:rounded-3xl max-lg:p-1">
          <div
            ref={frame}
            // Tapping the page anywhere but an ayah puts the selection away.
            onClick={(e) => !(e.target as Element).closest("[data-ayah]") && setSelection(null)}
            className="tint-border flex min-h-[70dvh] flex-col rounded-[1.4rem] border px-4 py-6 sm:px-10 sm:py-9 max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden max-lg:rounded-[1.25rem] max-lg:px-3 max-lg:py-3 sm:max-lg:px-8"
          >
            {/* Everything below is sized in em from here, so fitting the page scales it all together. */}
            {/* Centred on a short page (auto margins, unlike justify-center, never clip one that overflows). */}
            <div ref={text} className="text-[1.45rem] sm:text-[1.7rem] max-lg:my-auto">
              {sections.map((s) => (
                <section key={s.surah} id={`surah-${s.surah}`} className="scroll-mt-24">
                  {s.opens && (
                    <h2 className="tint-border tint-bg bg-khatam font-arabic relative my-[0.4em] rounded-xl border py-[0.25em] text-[0.75em] text-center! first:mt-0">
                      سورة {surahs[s.surah - 1].name}
                    </h2>
                  )}
                  {s.basmala && (
                    <p className="font-uthmani my-[0.3em] text-center text-[1.08em] leading-loose">{s.basmala}</p>
                  )}
                  <p
                    className={cn(
                      "font-uthmani text-justify leading-[2.2] text-foreground",
                      // A surah's last lines sit centred, as in print; text running on to the next page stays flush.
                      s.closes ? "[text-align-last:center]" : "[text-align-last:right]",
                    )}
                  >
                    {s.ayahs.map((a) => {
                      const [, words, number] = a.text.match(AYAH_NUMBER) ?? [a.text, a.text, ""];
                      const ayah = {
                        surah: s.surah,
                        n: a.n,
                        hafs: a.hafs,
                        hafsAyahs: a.hafsAyahs,
                        words,
                        last: s.closes && a === s.ayahs.at(-1),
                        tafsir: tafsir[`${s.surah}:${a.n}`] ?? {},
                      };
                      const isSelected = selected?.surah === s.surah && selected.n === a.n;
                      const isTarget = target?.surah === s.surah && target.n === a.n;
                      return (
                        // Keyed by the visit too, so searching for the same ayah again lights it up again.
                        <span key={isTarget ? `${a.n}:${target.visit}` : a.n}>
                          {/* Tapping an ayah selects it and opens its actions (tafsir, copy). */}
                          <span
                            id={`ayah-${s.surah}-${a.n}`}
                            data-ayah
                            role="button"
                            tabIndex={0}
                            aria-pressed={isSelected}
                            onClick={(e) => pick(ayah, e.currentTarget)}
                            onKeyDown={(e) => {
                              if (e.key !== "Enter" && e.key !== " ") return;
                              e.preventDefault();
                              pick(ayah, e.currentTarget);
                            }}
                            className={cn(
                              "cursor-pointer rounded-lg box-decoration-clone transition-colors outline-none hover:bg-white/4 focus-visible:bg-accent/60",
                              isSelected && "tint-bg hover:tint-bg",
                              isTarget && !isSelected && "animate-ayah-flash motion-reduce:tint-bg motion-reduce:animate-none",
                            )}
                          >
                            {words}
                            {/* The ayah mark in the riwayah's colour, so where each ayah ends stands out. */}
                            <span className="tint-fg">{isAr ? number : <AyahMark n={a.n} />}</span>
                          </span>{" "}
                        </span>
                      );
                    })}
                  </p>
                </section>
              ))}
            </div>
          </div>
        </div>

        <footer className="font-arabic pt-2 text-center text-sm text-muted-foreground max-lg:hidden">{mushafNumber(page, isAr)}</footer>
      </article>

      {/* Laid out like the mushaf: previous page on the right, next on the left. */}
      <nav dir="rtl" className="flex items-center justify-between gap-3 max-lg:hidden">
        {pageLink(prev, "prev", false)}
        <span dir="ltr" title={t("mushaf.pageOf", { n: num(page), total: num(pages) })} className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {num(page)} / {num(pages)}
        </span>
        {pageLink(next, "next", false)}
      </nav>
      {/* Phone: small turn buttons around the page number (swiping turns pages too). */}
      <nav dir="rtl" className="flex shrink-0 items-center justify-between lg:hidden">
        {pageLink(prev, "prev", true)}
        <span className="font-arabic text-sm text-muted-foreground" title={t("mushaf.pageOf", { n: num(page), total: num(pages) })}>
          {mushafNumber(page, isAr)}
        </span>
        {pageLink(next, "next", true)}
      </nav>

      {selection && selected && <AyahActions mushaf={mushaf} ayah={selected} side={selection.side} anchor={selection.anchor} onClose={closeAyah} />}

      <p className="pb-4 text-center text-xs text-muted-foreground max-lg:hidden">
        {t("watch.source")}{" "}
        <a href={mushafSource.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
          {l(mushafSource.name)}
        </a>
      </p>
    </div>
  );
}
