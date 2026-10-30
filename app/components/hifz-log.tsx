import { cn } from "cn";
import { ArrowLeft, BookCheck, CalendarDays, Check, ChevronDown, RotateCcw, Search, Undo2, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import { surahs } from "~/data/surahs";
import {
  ayahKey,
  DAY,
  DUE_DAYS,
  hifz,
  type HifzLogEntry,
  type HifzRange,
  memorizedRuns,
  type Riwayah,
  startOfDay,
  surahHifz,
} from "~/lib/hifz";
import { useLocalize } from "~/lib/localize";

// Logging what was memorized or revised. The page's panel offers the likely next step in one tap
// (the next new ayat, the surahs most in need of revision) and opens the log sheet: what kind, a
// surah (or a juz), its ayat picked by tapping the first and the last (as a range of dates is picked
// in a calendar) or a whole mushaf page, and the day. Each log can be undone from the toast after it.

type Kind = HifzLogEntry["kind"];

/** Below lg the sheet comes up from the bottom edge (as the tafsir panel does). */
const PHONE = "(max-width: 1023.98px)";

/** A riwayah's layout: the page of each ayah per surah, and where each juz starts ([surah, ayah]). */
export type HifzLayout = { pages: number[][]; juzStarts: [number, number][] };

/** What the sheet logs: some ayat of a surah (`open` while waiting for the last one) or a whole juz. */
type Target = { surah: number; from: number; to: number; open: boolean } | { juz: number };
type Draft = { kind: Kind; target: Target };

/** Something just logged, with the riwayah as it was before, to undo it. */
export type Logged = { mushafId: string; message: string; before: Riwayah };

/** "today", "3 days ago", "2 weeks ago"… in the UI language. */
export function useAgo() {
  const { lang } = useLocalize();
  const rtf = useMemo(() => new Intl.RelativeTimeFormat(lang, { numeric: "auto" }), [lang]);
  return (ms: number) => {
    const days = Math.round((startOfDay(Date.now()) - startOfDay(ms)) / DAY);
    if (days < 14) return rtf.format(-days, "day");
    if (days < 60) return rtf.format(-Math.round(days / 7), "week");
    return rtf.format(-Math.round(days / 30), "month");
  };
}

export function useSurahName() {
  const { isAr } = useLocalize();
  return (n: number) => (isAr ? `سورة ${surahs[n - 1].name}` : surahs[n - 1].translit);
}

/** A day as a date input's value, in local time. */
function dayValue(ms: number) {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

/** The ayat of a juz, surah by surah. */
export function juzParts(juz: number, { pages, juzStarts }: HifzLayout): HifzRange[] {
  const [s0, n0] = juzStarts[juz - 1];
  const [s1, n1] = juzStarts[juz] ?? [pages.length, pages[pages.length - 1].length + 1];
  const parts: HifzRange[] = [];
  for (let surah = s0; surah <= s1; surah++) {
    const from = surah === s0 ? n0 : 1;
    const to = surah === s1 ? n1 - 1 : pages[surah - 1].length;
    if (to >= from) parts.push({ surah, from, to });
  }
  return parts;
}

const isMemorized = (r: Riwayah, surah: number, n: number) => r.ayahs[ayahKey(surah, n)]?.m !== undefined;

/** A surah's first ayah not memorized yet (0 if it's all memorized). */
function firstGap(r: Riwayah, surah: number, ayahs: number) {
  for (let n = 1; n <= ayahs; n++) if (!isMemorized(r, surah, n)) return n;
  return 0;
}

/**
 * Where to carry on memorizing: after the last ayat memorized, else the surah's first gap, else the
 * next surah the way the reader is going (back from an-Nās, as many start, or onwards).
 */
export function nextToMemorize(r: Riwayah, pages: number[][]): { surah: number; n: number } {
  const done = r.log.filter((e) => e.kind === "memorized" && !e.juz);
  const last = done[0];
  if (!last) return { surah: 1, n: firstGap(r, 1, pages[0].length) || 1 };
  const s = last.surah;
  for (let n = last.to + 1; n <= pages[s - 1].length; n++) if (!isMemorized(r, s, n)) return { surah: s, n };
  const gap = firstGap(r, s, pages[s - 1].length);
  if (gap) return { surah: s, n: gap };
  const before = done.find((e) => e.surah !== s)?.surah;
  const step = before !== undefined ? Math.sign(s - before) || 1 : s >= 78 ? -1 : 1;
  for (let t = s + step; t >= 1 && t <= pages.length; t += step) {
    const n = firstGap(r, t, pages[t - 1].length);
    if (n) return { surah: t, n };
  }
  return { surah: s, n: 1 };
}

/** The surahs with something memorized, the longest since their last revision first. */
export function revisionQueue(r: Riwayah, pages: number[][]) {
  return pages
    .map((p, i) => ({ n: i + 1, ayahs: p.length, ...surahHifz(r, i + 1, p.length) }))
    .filter((s) => s.memorized > 0)
    .sort((a, b) => (a.oldestRevised ?? 0) - (b.oldestRevised ?? 0));
}

/** Where the sheet starts for a surah: its next new ayah to memorize, or all it has memorized to revise. */
function surahTarget(kind: Kind, surah: number, r: Riwayah, pages: number[][]): Target {
  const ayahs = pages[surah - 1].length;
  if (kind === "memorized") {
    const n = firstGap(r, surah, ayahs);
    return n ? { surah, from: n, to: n, open: true } : { surah, from: 1, to: ayahs, open: false };
  }
  const runs = memorizedRuns(r, surah, ayahs);
  return runs.length ? { surah, from: runs[0][0], to: runs.at(-1)![1], open: false } : { surah, from: 1, to: ayahs, open: false };
}

/** Logs a surah's memorized ayat as revised today, from one tap. */
function reviseSurah(mushafId: string, r: Riwayah, surah: number, ayahs: number) {
  hifz.logMany(
    mushafId,
    "revised",
    memorizedRuns(r, surah, ayahs).map(([from, to]) => ({ surah, from, to })),
  );
}

/** The quick way in: memorize the next ayat, revise a surah, and the surahs waiting for revision. */
export function LogPanel({
  mushafId,
  hue,
  layout,
  riwayah,
  onLogged,
}: {
  mushafId: string;
  hue: number;
  layout: HifzLayout;
  riwayah: Riwayah;
  onLogged: (logged: Logged) => void;
}) {
  const { t, num } = useLocalize();
  const ago = useAgo();
  const surahName = useSurahName();
  const { pages } = layout;
  const [draft, setDraft] = useState<Draft | null>(null);

  const next = nextToMemorize(riwayah, pages);
  const queue = revisionQueue(riwayah, pages);
  // Waiting for revision: not revised today, the most overdue first.
  const today = startOfDay(Date.now());
  const waiting = queue.filter((s) => (s.oldestRevised ?? 0) < today).slice(0, 3);
  const todayAyahs = riwayah.log
    .filter((e) => e.at >= today)
    .reduce((sum, e) => sum + (e.juz ? juzParts(e.juz, layout).reduce((n, p) => n + p.to - p.from + 1, 0) : e.to - e.from + 1), 0);

  const tile =
    "group flex min-w-0 flex-col items-start gap-3 rounded-2xl border p-3.5 text-start transition-[background-color,scale] active:scale-[0.98] sm:p-4";
  const icon = "flex size-9 items-center justify-center rounded-full";
  return (
    <section className="rounded-3xl border bg-card p-4 sm:p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
        <h2 className="font-semibold">{t("hifz.logTitle")}</h2>
        {todayAyahs > 0 && (
          <span className="tint-fg inline-flex items-center gap-1 text-xs whitespace-nowrap tabular-nums">
            <Check className="size-3.5" />
            {t("hifz.todayAyahs", { count: todayAyahs })}
          </span>
        )}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          type="button"
          data-guide="hifz-new"
          onClick={() => setDraft({ kind: "memorized", target: surahTarget("memorized", next.surah, riwayah, pages) })}
          className={cn(tile, "hover:bg-accent")}
        >
          <span className={cn(icon, "border")}>
            <BookCheck className="size-4.5" />
          </span>
          <span className="w-full min-w-0">
            <span className="block font-medium">{t("hifz.newMemorization")}</span>
            <span className="mt-0.5 block text-xs leading-snug break-words text-muted-foreground">
              {t("hifz.nextUp", { what: `${surahName(next.surah)} ${num(next.n)}` })}
            </span>
          </span>
        </button>
        <button
          type="button"
          data-guide="hifz-revise"
          onClick={() =>
            setDraft({ kind: "revised", target: surahTarget("revised", queue[0]?.n ?? next.surah, riwayah, pages) })
          }
          className={cn(tile, "hover:bg-accent")}
        >
          <span className={cn(icon, "border")}>
            <RotateCcw className="size-4.5" />
          </span>
          <span className="w-full min-w-0">
            <span className="block font-medium">{t("hifz.revision")}</span>
            <span className="mt-0.5 block text-xs leading-snug break-words text-muted-foreground">
              {queue[0] ? t("hifz.mostDue", { what: surahName(queue[0].n) }) : t("hifz.pickToRevise")}
            </span>
          </span>
        </button>
      </div>

      {waiting.length > 0 && (
        <div data-guide="hifz-queue" className="mt-4">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("hifz.toRevise")}</h3>
          <ul className="mt-1 divide-y">
            {waiting.map((s) => {
              const due = startOfDay(Date.now()) - startOfDay(s.oldestRevised ?? 0) > DUE_DAYS * DAY;
              const name = surahName(s.n);
              return (
                <li key={s.n} className="flex items-center gap-3 py-2">
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm">{name}</span>
                    <span className={cn("block text-xs text-muted-foreground", due && "text-amber-500")}>
                      {s.memorized < s.ayahs && `${t("hifz.memorizedOf", { n: num(s.memorized), total: num(s.ayahs) })} · `}
                      {s.oldestRevised !== undefined && t("hifz.revisedAgo", { ago: ago(s.oldestRevised) })}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      onLogged({ mushafId, before: riwayah, message: t("hifz.loggedRevised", { what: name }) });
                      reviseSurah(mushafId, riwayah, s.n, s.ayahs);
                    }}
                    aria-label={t("hifz.markRevised", { name })}
                    title={t("hifz.markRevised", { name })}
                    className="flex size-9 shrink-0 items-center justify-center rounded-full border text-muted-foreground transition-[background-color,color,scale] hover:bg-accent hover:text-foreground active:scale-90"
                  >
                    <Check className="size-4" />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <LogSheet
        mushafId={mushafId}
        hue={hue}
        layout={layout}
        riwayah={riwayah}
        draft={draft}
        setDraft={setDraft}
        onLogged={(logged) => {
          setDraft(null);
          onLogged(logged);
        }}
      />
    </section>
  );
}

/** The log sheet: a bottom sheet on phones, a dialog on larger screens. */
function LogSheet({
  mushafId,
  hue,
  layout,
  riwayah,
  draft,
  setDraft,
  onLogged,
}: {
  mushafId: string;
  hue: number;
  layout: HifzLayout;
  riwayah: Riwayah;
  draft: Draft | null;
  setDraft: (draft: Draft | null) => void;
  onLogged: (logged: Logged) => void;
}) {
  const { t } = useLocalize();
  // On phones its handle and header drag it down: let go far enough down, or flicked, it closes;
  // otherwise it glides back up.
  const [drag, setDrag] = useState<number | null>(null);
  const sheet = useRef<HTMLDivElement>(null);
  // While it slides away it keeps showing what it held.
  const [shown, setShown] = useState(draft);
  if (draft && draft !== shown) setShown(draft);
  function startDrag(e: React.PointerEvent) {
    if (!window.matchMedia(PHONE).matches || e.button !== 0 || (e.target as Element).closest("button, a, input")) return;
    const start = e.clientY;
    const height = sheet.current?.getBoundingClientRect().height ?? window.innerHeight;
    let last = { y: e.clientY, t: e.timeStamp };
    let velocity = 0; // px/ms, positive downwards
    let offset = 0;
    let moved = false;
    const move = (ev: PointerEvent) => {
      if (Math.abs(ev.clientY - start) > 6) moved = true;
      if (!moved) return;
      if (ev.timeStamp > last.t) velocity = (ev.clientY - last.y) / (ev.timeStamp - last.t);
      last = { y: ev.clientY, t: ev.timeStamp };
      offset = Math.max(ev.clientY - start, 0);
      setDrag(offset);
    };
    const end = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", end);
      window.removeEventListener("pointercancel", end);
      if (moved && (velocity > 0.5 || offset > height * 0.3)) {
        // Closed where the finger left it, so it slides on down from there.
        setDraft(null);
        setTimeout(() => setDrag(null), 300);
      } else setDrag(null);
    };
    window.addEventListener("pointermove", move);
    window.addEventListener("pointerup", end);
    window.addEventListener("pointercancel", end);
  }

  return (
    <Dialog open={!!draft} onOpenChange={(open) => !open && setDraft(null)}>
      <DialogContent
        ref={sheet}
        closeLabel={t("settings.close")}
        style={{ "--hue": hue, ...(drag ? { transform: `translateY(${drag}px)` } : {}) } as React.CSSProperties}
        className={cn(
          "flex h-[min(46rem,calc(100dvh-4rem))] flex-col gap-0 overflow-hidden p-0 sm:max-w-xl",
          // Phones: a sheet sliding up from the bottom edge (its close button level with the title, below the handle).
          "max-lg:top-auto max-lg:bottom-0 max-lg:left-0 max-lg:h-[90dvh] max-lg:w-full max-lg:max-w-none max-lg:translate-x-0 max-lg:translate-y-0 max-lg:rounded-t-3xl max-lg:rounded-b-none max-lg:border-x-0 max-lg:border-b-0 max-lg:duration-300 max-lg:ease-out max-lg:data-[state=closed]:slide-out-to-bottom max-lg:data-[state=open]:slide-in-from-bottom max-lg:data-[state=open]:zoom-in-100 max-lg:data-[state=closed]:zoom-out-100 max-lg:[&>button:last-child]:top-6",
          drag === null && "max-lg:transition-transform",
        )}
      >
        {/* Unmounted once closed, so its view and day start afresh on the next opening. */}
        {shown && (
          <SheetBody
            mushafId={mushafId}
            layout={layout}
            riwayah={riwayah}
            draft={shown}
            setDraft={setDraft}
            onLogged={onLogged}
            onDragStart={startDrag}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function SheetBody({
  mushafId,
  layout,
  riwayah,
  draft,
  setDraft,
  onLogged,
  onDragStart,
}: {
  mushafId: string;
  layout: HifzLayout;
  riwayah: Riwayah;
  draft: Draft;
  setDraft: (draft: Draft) => void;
  onLogged: (logged: Logged) => void;
  onDragStart: (e: React.PointerEvent) => void;
}) {
  const { t, num, lang } = useLocalize();
  const surahName = useSurahName();
  const { pages } = layout;
  const { kind, target } = draft;
  const [picking, setPicking] = useState(false);
  // The day: today, yesterday, or one picked (a date input's value).
  const [when, setWhen] = useState<"today" | "yesterday" | string>("today");

  const ranges = "juz" in target ? juzParts(target.juz, layout) : [target];
  const count = ranges.reduce((n, p) => n + p.to - p.from + 1, 0);
  const what =
    "juz" in target
      ? t("hifz.juz", { n: num(target.juz) })
      : `${surahName(target.surah)} ${target.from === target.to ? num(target.from) : `${num(target.from)}–${num(target.to)}`}`;

  function setKind(k: Kind) {
    if (k === kind) return;
    setDraft({ kind: k, target: "juz" in target ? target : surahTarget(k, target.surah, riwayah, pages) });
  }

  function save() {
    const today = startOfDay(Date.now());
    // A past day is logged at noon; today, now.
    const at =
      when === "today" ? Date.now() : when === "yesterday" ? today - DAY / 2 : new Date(`${when}T12:00`).getTime();
    onLogged({
      mushafId,
      before: riwayah,
      message: t(kind === "memorized" ? "hifz.loggedMemorized" : "hifz.loggedRevised", { what }),
    });
    if ("juz" in target) hifz.logMany(mushafId, kind, ranges, at, target.juz);
    else hifz.log(mushafId, kind, target.surah, target.from, target.to, at);
  }

  const segment = "flex flex-1 items-center justify-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition-colors";
  return (
    <>
      {/* The handle and the header drag the sheet down on phones (touch-none: the drag, not the browser, gets the swipe). */}
      <div onPointerDown={onDragStart} className="shrink-0 border-b px-4 pt-4 pb-3 max-lg:touch-none max-lg:pt-0 max-lg:select-none sm:px-5">
        <div aria-hidden className="flex justify-center pt-2.5 pb-2.5 lg:hidden">
          <span className="h-1.5 w-10 rounded-full bg-muted-foreground/40" />
        </div>
        <DialogTitle className="pe-10 text-base">{t("hifz.logTitle")}</DialogTitle>
        <DialogDescription className="sr-only">{t("hifz.logHint")}</DialogDescription>
        <div role="radiogroup" aria-label={t("hifz.logTitle")} className="mt-3 flex rounded-full border p-1">
          <button
            type="button"
            role="radio"
            aria-checked={kind === "memorized"}
            onClick={() => setKind("memorized")}
            className={cn(segment, kind === "memorized" ? "tint-solid text-[oklch(0.2_0.04_var(--hue))]" : "text-muted-foreground hover:text-foreground")}
          >
            <BookCheck className="size-4" />
            {t("hifz.newMemorization")}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={kind === "revised"}
            onClick={() => setKind("revised")}
            className={cn(segment, kind === "revised" ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground")}
          >
            <RotateCcw className="size-4" />
            {t("hifz.revision")}
          </button>
        </div>
      </div>

      {picking ? (
        <Picker
          layout={layout}
          riwayah={riwayah}
          onBack={() => setPicking(false)}
          onPick={(picked) => {
            setDraft({ kind, target: "juz" in picked ? picked : surahTarget(kind, picked.surah, riwayah, pages) });
            setPicking(false);
          }}
        />
      ) : (
        <>
          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
            <button
              type="button"
              onClick={() => setPicking(true)}
              className="flex w-full items-center gap-3 rounded-2xl border px-3 py-2.5 text-start transition-colors hover:bg-accent"
            >
              <span className="tint-bg tint-fg flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-medium tabular-nums">
                {num("juz" in target ? target.juz : target.surah)}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium">
                  {"juz" in target ? t("hifz.juz", { n: num(target.juz) }) : surahName(target.surah)}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {"juz" in target
                    ? ranges.map((p) => surahName(p.surah)).join(" · ")
                    : t("hifz.memorizedOf", {
                        n: num(surahHifz(riwayah, target.surah, pages[target.surah - 1].length).memorized),
                        total: num(pages[target.surah - 1].length),
                      })}
                </span>
              </span>
              <span className="shrink-0 text-xs text-muted-foreground">{t("hifz.change")}</span>
              <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
            </button>

            {"juz" in target ? (
              <JuzSummary ranges={ranges} />
            ) : (
              <AyahPicker
                target={target}
                pages={pages[target.surah - 1]}
                riwayah={riwayah}
                kind={kind}
                onChange={(next) => setDraft({ kind, target: next })}
              />
            )}
          </div>

          <div className="shrink-0 space-y-3 border-t px-4 pt-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] sm:px-5 sm:pb-4">
            <DayChips when={when} setWhen={setWhen} lang={lang} />
            {/* The button drops under the summary when a long label (French) leaves it too little room. */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <p className="min-w-28 flex-1 text-sm">
                <span className="block truncate font-medium">{what}</span>
                <span className="block text-xs text-muted-foreground">{t("hifz.rangeSize", { count })}</span>
              </p>
              <button
                type="button"
                onClick={save}
                className={cn(
                  "ms-auto inline-flex shrink-0 items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-[scale,filter] hover:brightness-110 active:scale-95",
                  kind === "memorized" ? "tint-solid text-[oklch(0.2_0.04_var(--hue))]" : "bg-foreground text-background",
                )}
              >
                <Check className="size-4" />
                {t(kind === "memorized" ? "hifz.saveMemorized" : "hifz.saveRevised")}
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

/** A surah's ayat by mushaf page: tap the first ayah then the last, or a page to take all of it. */
function AyahPicker({
  target,
  pages,
  riwayah,
  kind,
  onChange,
}: {
  target: { surah: number; from: number; to: number; open: boolean };
  pages: number[];
  riwayah: Riwayah;
  kind: Kind;
  onChange: (target: { surah: number; from: number; to: number; open: boolean }) => void;
}) {
  const { t, num } = useLocalize();
  const { surah, from, to, open } = target;
  const ayahs = pages.length;
  const runs = memorizedRuns(riwayah, surah, ayahs);
  const partly = runs.length > 0 && (runs.length > 1 || runs[0][0] !== 1 || runs[0][1] !== ayahs);

  // The second tap closes the range (or starts over if it's before the first); later taps start a new one.
  function tap(a: number, b = a) {
    if (open && a >= from) onChange({ surah, from, to: b, open: false });
    else onChange({ surah, from: a, to: b, open: a === b });
  }

  const groups: { page: number; first: number; last: number }[] = [];
  pages.forEach((page, i) => {
    const g = groups.at(-1);
    if (g?.page === page) g.last = i + 1;
    else groups.push({ page, first: i + 1, last: i + 1 });
  });

  const chip = "rounded-full border px-3 py-1 text-xs transition-colors hover:bg-accent";
  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-center gap-1.5">
        <button type="button" onClick={() => onChange({ surah, from: 1, to: ayahs, open: false })} className={chip}>
          {t("hifz.wholeSurah")}
        </button>
        {kind === "revised" && partly && (
          <button
            type="button"
            onClick={() => onChange({ surah, from: runs[0][0], to: runs.at(-1)![1], open: false })}
            className={chip}
          >
            {t("hifz.memorizedPart")}
          </button>
        )}
      </div>
      <p aria-live="polite" className={cn("mt-3 text-xs", open ? "tint-fg" : "text-muted-foreground")}>
        {open ? t("hifz.tapLast") : t("hifz.tapFirst")}
      </p>
      <div className="mt-2 space-y-3">
        {groups.map((g) => (
          <div key={g.page}>
            <button
              type="button"
              onClick={() => tap(g.first, g.last)}
              className="-ms-1.5 mb-0.5 rounded-md px-1.5 py-0.5 text-[0.7rem] text-muted-foreground underline decoration-dotted underline-offset-2 transition-colors hover:bg-accent hover:text-foreground"
            >
              {t("hifz.page", { n: num(g.page) })}
            </button>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(2.6rem,1fr))] gap-1">
              {Array.from({ length: g.last - g.first + 1 }, (_, i) => {
                const n = g.first + i;
                const inRange = n >= from && n <= to;
                const edge = n === from || n === to;
                const a = riwayah.ayahs[ayahKey(surah, n)];
                return (
                  <button
                    key={n}
                    type="button"
                    onClick={() => tap(n)}
                    aria-pressed={inRange}
                    aria-label={`${t("mushaf.ayah", { n: num(n) })}${a?.m !== undefined ? ` · ${t("hifz.memorized")}` : ""}`}
                    className={cn(
                      "relative flex h-10 items-center justify-center rounded-xl text-sm tabular-nums transition-colors",
                      inRange
                        ? edge
                          ? "tint-solid font-semibold text-[oklch(0.2_0.04_var(--hue))]"
                          : "bg-[oklch(0.75_0.12_var(--hue)/0.28)]"
                        : a?.m !== undefined
                          ? "tint-fg tint-bg hover:bg-[oklch(0.75_0.12_var(--hue)/0.2)]"
                          : "text-muted-foreground hover:bg-accent",
                      edge && open && "ring-2 ring-[oklch(0.78_0.12_var(--hue))] ring-offset-2 ring-offset-background",
                    )}
                  >
                    {num(n)}
                    {a?.w && <span className="absolute top-1 inset-e-1 size-1.5 rounded-full bg-amber-500" />}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 flex items-center gap-3 text-[0.7rem] text-muted-foreground">
        <span className="flex items-center gap-1">
          <span className="tint-bg tint-border size-3 rounded border" />
          {t("hifz.memorized")}
        </span>
        <span className="flex items-center gap-1">
          <span className="size-1.5 rounded-full bg-amber-500" />
          {t("hifz.weak")}
        </span>
      </p>
    </div>
  );
}

/** The surahs a juz spans, with the ayat of each. */
function JuzSummary({ ranges }: { ranges: HifzRange[] }) {
  const { num } = useLocalize();
  const surahName = useSurahName();
  return (
    <ul className="mt-3 divide-y rounded-2xl border text-sm">
      {ranges.map((p) => (
        <li key={p.surah} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="truncate">{surahName(p.surah)}</span>
          <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
            {num(p.from)}–{num(p.to)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** The day it was done: today, yesterday or a date picked. */
function DayChips({ when, setWhen, lang }: { when: string; setWhen: (when: string) => void; lang: string }) {
  const { t } = useLocalize();
  const today = dayValue(Date.now());
  const picked = when !== "today" && when !== "yesterday";
  const chip = (on: boolean) =>
    cn(
      "relative inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors",
      on ? "border-foreground/40 bg-accent text-foreground" : "text-muted-foreground hover:bg-accent",
    );
  return (
    <div role="radiogroup" aria-label={t("hifz.when")} className="flex flex-wrap items-center gap-1.5">
      <button type="button" role="radio" aria-checked={when === "today"} onClick={() => setWhen("today")} className={chip(when === "today")}>
        {t("hifz.today")}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={when === "yesterday"}
        onClick={() => setWhen("yesterday")}
        className={chip(when === "yesterday")}
      >
        {t("hifz.yesterday")}
      </button>
      <label className={cn(chip(picked), "cursor-pointer")}>
        <CalendarDays className="size-3.5" />
        {picked
          ? new Intl.DateTimeFormat(lang, { day: "numeric", month: "short", year: "numeric" }).format(new Date(`${when}T12:00`))
          : t("hifz.otherDay")}
        <input
          type="date"
          max={today}
          value={picked ? when : ""}
          onChange={(e) => e.currentTarget.value && setWhen(e.currentTarget.value === today ? "today" : e.currentTarget.value)}
          onClick={(e) => {
            try {
              e.currentTarget.showPicker();
            } catch {
              // Older browsers open it themselves.
            }
          }}
          aria-label={t("hifz.otherDay")}
          className="absolute inset-0 cursor-pointer opacity-0"
        />
      </label>
    </div>
  );
}

/** Choosing a surah (searchable, with how much of each is memorized) or a juz. */
function Picker({
  layout,
  riwayah,
  onBack,
  onPick,
}: {
  layout: HifzLayout;
  riwayah: Riwayah;
  onBack: () => void;
  onPick: (picked: { surah: number } | { juz: number }) => void;
}) {
  const { t, num, l } = useLocalize();
  const surahName = useSurahName();
  const [tab, setTab] = useState<"surah" | "juz">("surah");
  const [query, setQuery] = useState("");
  const { pages, juzStarts } = layout;

  const q = fold(query);
  const shown = surahs.filter(
    (s) => !q || String(s.n) === q || fold(s.translit).includes(q) || fold(s.name).includes(q) || fold(l(s.meaning)).includes(q),
  );

  const toggle = "flex-1 rounded-full px-3 py-1 text-xs transition-colors";
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-2 px-4 pt-3 sm:px-5">
        <button
          type="button"
          onClick={onBack}
          aria-label={t("hifz.back")}
          className="flex size-8 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <ArrowLeft className="size-4 rtl:rotate-180" />
        </button>
        <div className="flex flex-1 rounded-full border p-0.5">
          <button type="button" onClick={() => setTab("surah")} className={cn(toggle, tab === "surah" ? "bg-accent" : "text-muted-foreground")}>
            {t("quran.surahsTitle")}
          </button>
          <button type="button" onClick={() => setTab("juz")} className={cn(toggle, tab === "juz" ? "bg-accent" : "text-muted-foreground")}>
            {t("hifz.juzTab")}
          </button>
        </div>
      </div>

      {tab === "surah" ? (
        <>
          <div className="shrink-0 px-4 pt-3 sm:px-5">
            <label className="flex h-10 items-center gap-2 rounded-xl border bg-background px-3 focus-within:ring-2 focus-within:ring-ring/50">
              <Search className="size-4 shrink-0 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.currentTarget.value)}
                placeholder={t("hifz.searchSurah")}
                className="min-w-0 flex-1 bg-transparent text-sm outline-none"
              />
              {query && (
                <button type="button" onClick={() => setQuery("")} aria-label={t("settings.close")} className="text-muted-foreground">
                  <X className="size-4" />
                </button>
              )}
            </label>
          </div>
          <ul className="mt-2 min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 sm:px-3">
            {shown.map((s) => {
              const h = surahHifz(riwayah, s.n, pages[s.n - 1].length);
              const ayahs = pages[s.n - 1].length;
              return (
                <li key={s.n}>
                  <button
                    type="button"
                    onClick={() => onPick({ surah: s.n })}
                    className="flex w-full items-center gap-3 rounded-xl px-2 py-2 text-start transition-colors hover:bg-accent"
                  >
                    <span className="flex size-8 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground tabular-nums">
                      {num(s.n)}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{surahName(s.n)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {h.memorized === 0
                          ? t("quran.ayahs", { count: ayahs })
                          : t("hifz.memorizedOf", { n: num(h.memorized), total: num(ayahs) })}
                      </span>
                    </span>
                    {h.memorized === ayahs ? (
                      <Check className="tint-fg size-4 shrink-0" />
                    ) : (
                      h.memorized > 0 && <Ring value={h.memorized / ayahs} />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </>
      ) : (
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-3 sm:px-5">
          <div className="grid grid-cols-5 gap-1.5">
            {juzStarts.map(([surah], i) => {
              const parts = juzParts(i + 1, layout);
              let total = 0;
              let done = 0;
              for (const p of parts)
                for (let n = p.from; n <= p.to; n++) {
                  total++;
                  if (isMemorized(riwayah, p.surah, n)) done++;
                }
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => onPick({ juz: i + 1 })}
                  title={surahName(surah)}
                  className={cn(
                    "relative flex aspect-square flex-col items-center justify-center overflow-hidden rounded-xl border text-sm tabular-nums transition-colors hover:bg-accent",
                    done === total && "tint-border tint-bg tint-fg",
                  )}
                >
                  {num(i + 1)}
                  {done > 0 && done < total && (
                    <span className="absolute inset-x-2 bottom-1.5 h-1 overflow-hidden rounded-full bg-muted">
                      <span className="tint-solid block h-full" style={{ width: `${(done / total) * 100}%` }} />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{t("hifz.juzHint")}</p>
        </div>
      )}
    </div>
  );
}

/** A small progress ring. */
function Ring({ value }: { value: number }) {
  const c = 2 * Math.PI * 7;
  return (
    <svg viewBox="0 0 18 18" className="size-4.5 shrink-0 -rotate-90" aria-hidden>
      <circle cx="9" cy="9" r="7" fill="none" strokeWidth="2.5" className="stroke-muted" />
      <circle
        cx="9"
        cy="9"
        r="7"
        fill="none"
        strokeWidth="2.5"
        strokeDasharray={`${value * c} ${c}`}
        strokeLinecap="round"
        className="stroke-[oklch(0.78_0.12_var(--hue))]"
      />
    </svg>
  );
}

/** Lower case, without accents, hyphens, apostrophes or Arabic vowel marks: for matching names. */
function fold(s: string) {
  return s
    .normalize("NFD")
    .replace(/[̀-ًͯ-ٰٟـ'’`\-\s]/g, "")
    .replace(/[أإآٱ]/g, "ا")
    .replace(/ة/g, "ه")
    .toLowerCase()
    .replace(/^(al|an|ar|as|at|ad|adh|az|ash|aal|ال)/, "");
}

/** What was just logged, for a few seconds, with Undo. */
export function UndoToast({ logged, onDone }: { logged: Logged | null; onDone: () => void }) {
  const { t } = useLocalize();
  useEffect(() => {
    if (!logged) return;
    const timer = setTimeout(onDone, 6000);
    return () => clearTimeout(timer);
  }, [logged, onDone]);
  if (!logged) return null;
  return (
    <div
      role="status"
      className="fixed inset-x-4 bottom-[calc(4.75rem+env(safe-area-inset-bottom))] z-40 mx-auto flex max-w-md items-center gap-3 rounded-2xl border bg-popover py-2.5 ps-4 pe-2 text-sm shadow-lg duration-300 animate-in fade-in-0 slide-in-from-bottom-4 lg:inset-s-84 lg:bottom-6"
    >
      <Check className="tint-fg size-4 shrink-0" />
      <span className="min-w-0 flex-1 truncate">{logged.message}</span>
      <button
        type="button"
        onClick={() => {
          hifz.restore(logged.mushafId, logged.before);
          onDone();
        }}
        className="inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors hover:bg-accent"
      >
        <Undo2 className="size-4" />
        {t("hifz.undo")}
      </button>
    </div>
  );
}
