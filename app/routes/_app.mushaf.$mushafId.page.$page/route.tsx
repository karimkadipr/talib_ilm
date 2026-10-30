import { cn } from "cn";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { data, href, Link, useLocation, useNavigate, useNavigation } from "react-router";
import { AyahActions, type SelectedAyah } from "~/components/ayah-actions";
import { BackLink } from "~/components/back-link";
import { MushafGuide } from "~/components/mushaf-guide";
import { QuranSearchDialog } from "~/components/quran-search";
import { ayahWords, getAyah, getPageLines, pageCount } from "~/data/mushaf.server";
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
  const rows = mushaf && Number.isInteger(page) && page >= 1 ? getPageLines(mushaf.id, page) : undefined;
  if (!mushaf || !rows) throw data(null, { status: 404 });
  const { l, num, t } = localizer(context);
  // Every ayah with words on the page (one running on from the page before too), by "surah:ayah":
  // what its panel needs, and its short in-app tafsirs, ready for a tap.
  const ayahs: Record<string, Omit<SelectedAyah, "surah" | "n"> & { juz: number }> = {};
  for (const row of rows)
    if (row.kind === "line")
      for (const p of row.parts) {
        const key = `${p.surah}:${p.n}`;
        if (ayahs[key]) continue;
        const a = getAyah(mushaf.id, p.surah, p.n)!;
        ayahs[key] = {
          hafs: a.hafs,
          hafsAyahs: a.hafsAyahs,
          words: ayahWords(a.text).join(" "),
          juz: a.juz,
          tafsir: Object.fromEntries(
            tafsirs.filter((x) => x.preload).map((x): [string, TafsirPart[]] => [x.id, getTafsir(x.id, p.surah, a.hafsAyahs)]),
          ),
        };
      }
  const firstSurah = rows[0].kind === "surah" ? rows[0].surah : rows.find((r) => r.kind === "line")!.parts[0].surah;
  return {
    mushafId: mushaf.id,
    page,
    pages: pageCount(mushaf.id),
    rows,
    ayahs,
    meta: seo(context, [`${surahs[firstSurah - 1].name} · ${t("mushaf.page", { n: num(page) })}`, l(mushaf.name)]),
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

/** Below lg the page fills the screen, so its text is sized to fit the frame instead of scrolling. */
const PHONE = "(max-width: 1023.98px)";
/** Each printed line's height, in em of the text. */
const LINE = 1.95;
/** The line width (em) the text is sized for, the same on every page so turning pages keeps it steady:
 * most pages' lines are narrower (they sit centred), only the widest tenth come out a little smaller. */
const TYPICAL = 19;

/**
 * Lays the page out as printed: every line the same width, edge to edge. The font isn't stretched
 * the way the printed page's letters are, so its lines differ a little in natural width: the text is
 * set to a width just above the page's usual line (its widest lines squeezed to it, by 8% at most,
 * the others spread out by their spaces), then sized so a typical line fills the frame, and on phones so
 * the whole page also fits its height (between 10 and 40px), its lines spread down the frame as on
 * the printed page. The first two pages' short lines are centred instead, as printed. Measured again
 * once the font has loaded, and on resize/rotation.
 */
function usePrintedLines(frame: React.RefObject<HTMLElement | null>, text: React.RefObject<HTMLElement | null>, key: unknown) {
  useLayoutEffect(() => {
    const box = frame.current;
    const el = text.current;
    if (!box || !el) return;
    const phone = window.matchMedia(PHONE);
    const fit = () => {
      const lines = [...el.querySelectorAll<HTMLElement>("[data-line]")];
      const rows = el.querySelectorAll("[data-row]").length;
      const opening = rows < 15;
      // Each line's natural width, in em.
      el.style.fontSize = "100px";
      el.dataset.measure = "";
      const natural = lines.map((l) => l.offsetWidth / 100);
      delete el.dataset.measure;
      const sorted = [...natural].sort((a, b) => a - b);
      const widest = sorted.at(-1) ?? 1;
      const usual = sorted[Math.floor(sorted.length / 2)] ?? widest;
      const width = opening ? widest : Math.max(Math.min(widest, usual * 1.08), widest * 0.92);

      const s = getComputedStyle(box);
      const roomX = box.clientWidth - parseFloat(s.paddingLeft) - parseFloat(s.paddingRight);
      const roomY = box.clientHeight - parseFloat(s.paddingTop) - parseFloat(s.paddingBottom);
      let size = roomX / (opening ? width : Math.max(width, TYPICAL));
      if (phone.matches) size = Math.min(size, (roomY - 2) / (rows * LINE));
      size = Math.min(Math.max(size, 10), 40);
      el.style.fontSize = `${size}px`;
      el.style.width = `${width}em`;
      // Lines a little further apart where there's height to spare (not so far they drift apart).
      const line = phone.matches && !opening ? Math.min(Math.max(LINE, (roomY - 2) / rows / size), LINE * 1.35) : LINE;
      el.style.setProperty("--line", `${line}em`);
      lines.forEach((l, i) => {
        const squeeze = natural[i] > width;
        l.style.width = squeeze ? `${natural[i]}em` : "";
        l.style.transform = squeeze ? `scaleX(${width / natural[i]})` : "";
        // A short line (the end of an-Najm) sits centred rather than spread out.
        l.style.textAlignLast = natural[i] < width * 0.6 ? "center" : "";
      });
      box.style.overflowY = phone.matches && el.offsetHeight > roomY ? "auto" : "";
    };
    fit();
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
  const { page, pages, rows, ayahs } = loaderData;
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
  usePrintedLines(frame, text, page);

  const to = (n: number) => href("/mushaf/:mushafId/page/:page", { mushafId: mushaf.id, page: String(n) });
  const back = href("/mushaf/:mushafId", { mushafId: mushaf.id });
  const prev = page > 1 ? page - 1 : null;
  const next = page < pages ? page + 1 : null;
  const firstLine = rows.find((r) => r.kind === "line")!.parts[0];
  const surahName = `سورة ${surahs[(rows[0].kind === "surah" ? rows[0].surah : firstLine.surah) - 1].name}`;
  const juz = `الجزء ${mushafNumber(ayahs[`${firstLine.surah}:${firstLine.n}`].juz, isAr)}`;

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
  function pick(surah: number, n: number) {
    // Selecting words to copy them isn't a tap on the ayah.
    if (window.getSelection()?.toString()) return;
    if (selected?.surah === surah && selected.n === n) return setSelection(null);
    const key = `${surah}:${n}`;
    const { juz: _juz, ...rest } = ayahs[key];
    // An ayah may run over several lines: the panel keeps clear of all of them.
    const rects = [...document.querySelectorAll(`[data-ayah="${key}"]`)].map((el) => el.getBoundingClientRect());
    const top = Math.min(...rects.map((r) => r.top));
    const bottom = Math.max(...rects.map((r) => r.bottom));
    setSelection({
      page,
      ayah: { surah, n, ...rest },
      side: (top + bottom) / 2 > window.innerHeight * 0.55 ? "top" : "bottom",
      anchor: { top, bottom },
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

  // The first line of each ayah carries its id (search and links scroll to it).
  const seen = new Set<string>();

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
          data-guide="search"
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
          data-guide="search"
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
            className="tint-border flex flex-col items-center rounded-[1.4rem] border px-4 py-6 sm:px-10 sm:py-9 max-lg:min-h-0 max-lg:flex-1 max-lg:overflow-hidden max-lg:rounded-[1.25rem] max-lg:px-2 max-lg:py-3 sm:max-lg:px-8"
          >
            {/* The page's lines, sized together from here in em (usePrintedLines sets its size and width). */}
            {/* On phones they're spread over the frame's height, as on the printed page. */}
            <div
              ref={text}
              style={{ "--line": `${LINE}em` } as React.CSSProperties}
              className={cn(
                "flex flex-col text-[1.6rem] max-lg:my-auto",
                // While measuring: each line at its natural width, unsqueezed.
                "data-measure:**:data-line:w-max! data-measure:**:data-line:transform-none!",
              )}
            >
              {rows.map((row, i) => {
                if (row.kind === "surah")
                  return (
                    <div key={i} data-row className="flex h-(--line) items-center">
                      <h2
                        id={`surah-${row.surah}`}
                        className="tint-border tint-bg bg-khatam font-arabic w-full scroll-mt-24 rounded-xl border py-[0.2em] text-center text-[0.7em] leading-normal"
                      >
                        سورة {surahs[row.surah - 1].name}
                      </h2>
                    </div>
                  );
                if (row.kind === "basmala")
                  return (
                    <p key={i} data-row className="font-uthmani flex h-(--line) items-center justify-center leading-none">
                      {row.text}
                    </p>
                  );
                return (
                  <div key={i} data-row className="flex h-(--line) items-center">
                    <p
                      data-line
                      className={cn(
                        "font-uthmani w-full origin-right leading-none whitespace-nowrap text-foreground",
                        rows.length < 15 ? "text-center" : "text-justify [text-align-last:justify]",
                      )}
                    >
                      {row.parts.map((p, j) => {
                        const key = `${p.surah}:${p.n}`;
                        const first = !seen.has(key);
                        seen.add(key);
                        const isSelected = selected?.surah === p.surah && selected.n === p.n;
                        const isTarget = target?.surah === p.surah && target.n === p.n;
                        return (
                          <span key={isTarget ? `${j}:${target.visit}` : j}>
                            {/* Tapping an ayah selects it and opens its actions (tafsir, copy). */}
                            <span
                              id={first ? `ayah-${p.surah}-${p.n}` : undefined}
                              data-ayah={key}
                              role="button"
                              tabIndex={first ? 0 : -1}
                              aria-pressed={isSelected}
                              onClick={() => pick(p.surah, p.n)}
                              onKeyDown={(e) => {
                                if (e.key !== "Enter" && e.key !== " ") return;
                                e.preventDefault();
                                pick(p.surah, p.n);
                              }}
                              className={cn(
                                "cursor-pointer rounded-md box-decoration-clone py-[0.2em] transition-colors outline-none hover:bg-white/4 focus-visible:bg-accent/60",
                                isSelected && "tint-bg hover:tint-bg",
                                isTarget && !isSelected && "animate-ayah-flash motion-reduce:tint-bg motion-reduce:animate-none",
                              )}
                            >
                              {p.words}
                              {/* The ayah mark in the riwayah's colour, so where each ayah ends stands out. */}
                              {p.end && <span className="tint-fg">{isAr ? ` ${p.n.toLocaleString("ar-EG")}` : <AyahMark n={p.n} />}</span>}
                            </span>
                            {j < row.parts.length - 1 && " "}
                          </span>
                        );
                      })}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <footer className="font-arabic pt-2 text-center text-sm text-muted-foreground max-lg:hidden">{mushafNumber(page, isAr)}</footer>
      </article>

      {/* Laid out like the mushaf: previous page on the right, next on the left. */}
      <nav dir="rtl" data-guide="pages" className="flex items-center justify-between gap-3 max-lg:hidden">
        {pageLink(prev, "prev", false)}
        <span dir="ltr" title={t("mushaf.pageOf", { n: num(page), total: num(pages) })} className="text-xs whitespace-nowrap text-muted-foreground tabular-nums">
          {num(page)} / {num(pages)}
        </span>
        {pageLink(next, "next", false)}
      </nav>
      {/* Phone: small turn buttons around the page number (swiping turns pages too). */}
      <nav dir="rtl" data-guide="pages" className="flex shrink-0 items-center justify-between lg:hidden">
        {pageLink(prev, "prev", true)}
        <span className="font-arabic text-sm text-muted-foreground" title={t("mushaf.pageOf", { n: num(page), total: num(pages) })}>
          {mushafNumber(page, isAr)}
        </span>
        {pageLink(next, "next", true)}
      </nav>

      {/* First visit: what can be done here. */}
      <MushafGuide hue={mushaf.hue} searching={searching} ayahOpen={!!selection} />

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
