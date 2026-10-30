import { cn } from "cn";
import { BookCheck, BookOpen, ChevronDown, Flag, Link2Off, RotateCcw, Trash2, X } from "lucide-react";
import { type HifzLayout, juzParts, LogPanel, type Logged, UndoToast, useAgo, useSurahName } from "~/components/hifz-log";
import { useCallback, useEffect, useState } from "react";
import { data, href, Link } from "react-router";
import { BackLink } from "~/components/back-link";
import { Progress } from "~/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { categoryOf, itemInfo } from "~/data/categories";
import { getMushafText } from "~/data/mushaf.server";
import { getMushaf, type Mushaf } from "~/data/mushafs";
import {
  ayahKey,
  DAY,
  DUE_DAYS,
  hifz,
  type HifzLogEntry,
  memorizedRuns,
  type Riwayah,
  startOfDay,
  surahHifz,
  useHifz,
} from "~/lib/hifz";
import { useLocalize } from "~/lib/localize";
import { pageMeta } from "~/lib/meta";
import { localizer, seo } from "~/lib/meta.server";
import type { Route } from "./+types/route";

export async function loader({ params, context }: Route.LoaderArgs) {
  const mushaf = getMushaf(params.mushafId);
  if (!mushaf) throw data(null, { status: 404 });
  const { l, t } = localizer(context);
  return {
    mushafId: mushaf.id,
    meta: seo(context, [`${t("hifz.title")} · ${l(mushaf.name)}`]),
    ...layout(mushaf.id),
  };
}

/** Per surah, the mushaf page of each of its ayat in this riwayah (so also how many it has); where each juz starts. */
function layout(mushafId: Mushaf["id"]): HifzLayout {
  const text = getMushafText(mushafId);
  const juzStarts: [number, number][] = [];
  for (const s of text) for (const a of s.ayahs) if (a.juz > juzStarts.length) juzStarts.push([s.n, a.n]);
  return { pages: text.map((s) => s.ayahs.map((a) => a.page)), juzStarts };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

const pageLink = (mushafId: string, page: number, surah: number, n: number) =>
  `${href("/mushaf/:mushafId/page/:page", { mushafId, page: String(page) })}#ayah-${surah}-${n}`;

/** One ayah in a surah's grid: its state at a glance, and a menu to change it. */
function AyahChip({
  mushafId,
  surah,
  n,
  last,
  page,
  riwayah,
}: {
  mushafId: string;
  surah: number;
  n: number;
  last: boolean;
  page: number;
  riwayah: Riwayah;
}) {
  const { t, num } = useLocalize();
  const ago = useAgo();
  const a = riwayah.ayahs[ayahKey(surah, n)] ?? {};
  const memorized = a.m !== undefined;
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex h-8 min-w-8 items-center justify-center rounded-lg border px-1 text-xs tabular-nums transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/50",
            memorized ? "tint-bg tint-fg tint-border" : "text-muted-foreground hover:bg-accent",
            a.w && "ring-2 ring-amber-500/90",
          )}
          aria-label={`${t("mushaf.ayah", { n: num(n) })}${memorized ? ` · ${t("hifz.memorized")}` : ""}${a.w ? ` · ${t("hifz.weak")}` : ""}`}
        >
          {num(n)}
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-56">
          <DropdownMenuLabel className="font-normal">
            <span className="font-medium">{t("mushaf.ayah", { n: num(n) })}</span>
            {a.r !== undefined && (
              <span className="block text-xs text-muted-foreground">{t("hifz.revisedAgo", { ago: ago(a.r) })}</span>
            )}
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuCheckboxItem
            checked={memorized}
            onCheckedChange={(on) => (on ? hifz.log(mushafId, "memorized", surah, n, n) : hifz.forget(mushafId, surah, n, n))}
          >
            {t("hifz.memorized")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem checked={!!a.w} onCheckedChange={(on) => hifz.setWeak(mushafId, surah, n, on)}>
            {t("hifz.weakAyah")}
          </DropdownMenuCheckboxItem>
          <DropdownMenuCheckboxItem
            checked={!!a.t}
            disabled={last}
            onCheckedChange={(on) => hifz.setWeakTransition(mushafId, surah, n, on)}
          >
            {t("hifz.weakTransitionTo", { n: num(n + 1) })}
          </DropdownMenuCheckboxItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => hifz.log(mushafId, "revised", surah, n, n)}>
            <RotateCcw />
            {t("hifz.revisedToday")}
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to={pageLink(mushafId, page, surah, n)}>
              <BookOpen />
              {t("hifz.openInMushaf")}
            </Link>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      {/* A weak transition: a bar joining the ayah to the next. */}
      {a.t && <span aria-label={t("hifz.weakTransition")} className="-mx-1 h-1 w-2.5 self-center rounded-full bg-amber-500" />}
    </>
  );
}

/** A surah's ayat as a grid of numbers, and logging a revision of all it has memorized. */
function SurahGrid({
  mushafId,
  surah,
  pages,
  riwayah,
  onLogged,
}: {
  mushafId: string;
  surah: number;
  pages: number[];
  riwayah: Riwayah;
  onLogged: (logged: Logged) => void;
}) {
  const { t } = useLocalize();
  const surahName = useSurahName();
  const runs = memorizedRuns(riwayah, surah, pages.length);
  return (
    <div className="space-y-3 px-4 pb-4">
      <div className="flex flex-wrap gap-1.5">
        {pages.map((page, i) => (
          <AyahChip
            key={i}
            mushafId={mushafId}
            surah={surah}
            n={i + 1}
            last={i === pages.length - 1}
            page={page}
            riwayah={riwayah}
          />
        ))}
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          disabled={!runs.length}
          onClick={() => {
            onLogged({ mushafId, before: riwayah, message: t("hifz.loggedRevised", { what: surahName(surah) }) });
            hifz.logMany(mushafId, "revised", runs.map(([from, to]) => ({ surah, from, to })));
          }}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent disabled:pointer-events-none disabled:opacity-40"
        >
          <RotateCcw className="size-3.5" />
          {t("hifz.revisedSurahToday")}
        </button>
        <Link
          to={pageLink(mushafId, pages[0], surah, 1)}
          className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs transition-colors hover:bg-accent"
        >
          <BookOpen className="size-3.5" />
          {t("hifz.openInMushaf")}
        </Link>
        <span className="ms-auto flex items-center gap-3 text-[0.7rem] text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="tint-bg tint-border size-3 rounded border" />
            {t("hifz.memorized")}
          </span>
          <span className="flex items-center gap-1">
            <span className="size-3 rounded ring-2 ring-amber-500/90" />
            {t("hifz.weak")}
          </span>
          <span className="flex items-center gap-1">
            <span className="h-1 w-2.5 rounded-full bg-amber-500" />
            {t("hifz.weakTransition")}
          </span>
        </span>
      </div>
    </div>
  );
}

/** The surahs with something memorized (or all 114), each opening onto its ayat. */
function SurahList({
  mushaf,
  pages,
  riwayah,
  onLogged,
}: {
  mushaf: Mushaf;
  pages: number[][];
  riwayah: Riwayah;
  onLogged: (logged: Logged) => void;
}) {
  const { t, num } = useLocalize();
  const ago = useAgo();
  const surahName = useSurahName();
  const [all, setAll] = useState(false);
  const [order, setOrder] = useState<"mushaf" | "due">("mushaf");
  const [open, setOpen] = useState<number | null>(null);
  const rows = pages
    .map((p, i) => ({ n: i + 1, ayahs: p.length, ...surahHifz(riwayah, i + 1, p.length) }))
    .filter((s) => all || s.memorized > 0 || s.weak > 0 || s.transitions > 0);
  // "To revise first": the longest since their last revision at the top.
  if (order === "due") rows.sort((x, y) => (x.lastRevised ?? Infinity) - (y.lastRevised ?? Infinity));

  const toggle = "rounded-full px-3 py-1 text-xs transition-colors";
  const on = "bg-accent text-foreground";
  const off = "text-muted-foreground hover:text-foreground";
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex rounded-full border p-0.5">
          <button type="button" onClick={() => setAll(false)} className={cn(toggle, !all ? on : off)}>
            {t("hifz.inProgress")}
          </button>
          <button type="button" onClick={() => setAll(true)} className={cn(toggle, all ? on : off)}>
            {t("quran.allSurahs")}
          </button>
        </div>
        <div className="flex rounded-full border p-0.5">
          <button type="button" onClick={() => setOrder("mushaf")} className={cn(toggle, order === "mushaf" ? on : off)}>
            {t("hifz.orderMushaf")}
          </button>
          <button type="button" onClick={() => setOrder("due")} className={cn(toggle, order === "due" ? on : off)}>
            {t("hifz.orderDue")}
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-6 text-center text-sm leading-relaxed text-muted-foreground">
          {t("hifz.empty")}
        </p>
      ) : (
        <ol className="divide-y overflow-hidden rounded-2xl border bg-card">
          {rows.map((s) => {
            const due = s.lastRevised !== undefined && startOfDay(Date.now()) - startOfDay(s.lastRevised) > DUE_DAYS * DAY;
            const expanded = open === s.n;
            return (
              <li key={s.n}>
                <button
                  type="button"
                  onClick={() => setOpen(expanded ? null : s.n)}
                  aria-expanded={expanded}
                  className="flex w-full items-center gap-3 px-3 py-3 text-start transition-colors hover:bg-accent/40 sm:px-4"
                >
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-full border text-xs text-muted-foreground tabular-nums">
                    {num(s.n)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="truncate font-medium">{surahName(s.n)}</span>
                      <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                        {num(s.memorized)}/{num(s.ayahs)}
                      </span>
                    </span>
                    <Progress value={(s.memorized / s.ayahs) * 100} className="tint-bg *:tint-solid mt-1.5 h-1.5" />
                    <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-muted-foreground">
                      {s.lastRevised !== undefined && (
                        <span className={cn(due && "text-amber-500")}>{t("hifz.revisedAgo", { ago: ago(s.lastRevised) })}</span>
                      )}
                      {s.weak > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Flag className="size-3" />
                          {t("hifz.weakCount", { count: s.weak })}
                        </span>
                      )}
                      {s.transitions > 0 && (
                        <span className="inline-flex items-center gap-1 text-amber-500">
                          <Link2Off className="size-3" />
                          {t("hifz.transitionCount", { count: s.transitions })}
                        </span>
                      )}
                    </span>
                  </span>
                  <ChevronDown className={cn("size-4 shrink-0 text-muted-foreground transition-transform", expanded && "rotate-180")} />
                </button>
                {expanded && (
                  <SurahGrid mushafId={mushaf.id} surah={s.n} pages={pages[s.n - 1]} riwayah={riwayah} onLogged={onLogged} />
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/** Some ayat's words, fetched for the weak spots list. */
function useAyahTexts(mushafId: string, refs: string[]) {
  const key = refs.join(",");
  const [texts, setTexts] = useState<Record<string, string>>({});
  useEffect(() => {
    if (!key) return;
    let live = true;
    fetch(`${href("/api/loaders/mushaf/:mushafId/ayahs", { mushafId })}?refs=${key}`)
      .then((r) => (r.ok ? r.json() : {}))
      .then((t) => live && setTexts((old) => ({ ...old, ...t })))
      .catch(() => {});
    return () => {
      live = false;
    };
  }, [mushafId, key]);
  return texts;
}

/** The flagged ayat and transitions, with their words, to work on and clear once fixed. */
function WeakSpots({ mushaf, pages, riwayah }: { mushaf: Mushaf; pages: number[][]; riwayah: Riwayah }) {
  const { t, num } = useLocalize();
  const surahName = useSurahName();
  const flagged = Object.entries(riwayah.ayahs)
    .map(([key, a]) => {
      const [surah, n] = key.split(":").map(Number);
      return { surah, n, ...a };
    })
    .sort((x, y) => x.surah - y.surah || x.n - y.n);
  const weak = flagged.filter((a) => a.w);
  const transitions = flagged.filter((a) => a.t);
  const texts = useAyahTexts(mushaf.id, [
    ...weak.map((a) => ayahKey(a.surah, a.n)),
    ...transitions.flatMap((a) => [ayahKey(a.surah, a.n), ayahKey(a.surah, a.n + 1)]),
  ].slice(0, 200));

  if (!weak.length && !transitions.length) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm leading-relaxed text-muted-foreground">
        {t("hifz.noWeak")}
      </p>
    );
  }

  const words = (key: string, from: "start" | "end", count = 5) => {
    const w = (texts[key] ?? "").split(" ").filter(Boolean);
    if (w.length <= count) return w.join(" ");
    return from === "start" ? `${w.slice(0, count).join(" ")} …` : `… ${w.slice(-count).join(" ")}`;
  };
  const item = (
    a: { surah: number; n: number },
    label: string,
    body: React.ReactNode,
    clear: () => void,
  ) => (
    <li key={`${label}-${a.surah}-${a.n}`} className="px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <Link to={pageLink(mushaf.id, pages[a.surah - 1][a.n - 1], a.surah, a.n)} className="min-w-0 truncate text-sm font-medium hover:underline">
          {label}
        </Link>
        <button
          type="button"
          onClick={clear}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border px-2.5 py-1 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-3" />
          {t("hifz.fixed")}
        </button>
      </div>
      <p lang="ar" dir="rtl" className="font-uthmani mt-1.5 text-xl leading-loose">
        {body}
      </p>
    </li>
  );

  return (
    <div className="space-y-6">
      {weak.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Flag className="size-4 text-amber-500" />
            {t("hifz.weakAyahs")} <span className="font-normal text-muted-foreground">{num(weak.length)}</span>
          </h3>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {weak.map((a) =>
              item(
                a,
                `${surahName(a.surah)} · ${t("mushaf.ayah", { n: num(a.n) })}`,
                <span className="line-clamp-3">{texts[ayahKey(a.surah, a.n)] ?? "…"}</span>,
                () => hifz.setWeak(mushaf.id, a.surah, a.n, false),
              ),
            )}
          </ul>
        </section>
      )}
      {transitions.length > 0 && (
        <section>
          <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold">
            <Link2Off className="size-4 text-amber-500" />
            {t("hifz.weakTransitions")} <span className="font-normal text-muted-foreground">{num(transitions.length)}</span>
          </h3>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {transitions.map((a) =>
              item(
                a,
                `${surahName(a.surah)} · ${t("hifz.transitionLabel", { from: num(a.n), to: num(a.n + 1) })}`,
                // The end of the ayah, then (after its number) the start of the next: where the reader stalls.
                <>
                  {words(ayahKey(a.surah, a.n), "end")}{" "}
                  <span className="mx-1 inline-flex h-6 min-w-6 items-center justify-center rounded-full bg-amber-500/15 px-1.5 align-middle font-sans text-xs text-amber-500">
                    {num(a.n)}
                  </span>{" "}
                  <span className="text-amber-500">{words(ayahKey(a.surah, a.n + 1), "start")}</span>
                </>,
                () => hifz.setWeakTransition(mushaf.id, a.surah, a.n, false),
              ),
            )}
          </ul>
        </section>
      )}
    </div>
  );
}

/** What was memorized and revised, day by day. */
function History({ mushaf, layout, riwayah }: { mushaf: Mushaf; layout: HifzLayout; riwayah: Riwayah }) {
  const { t, num } = useLocalize();
  const ago = useAgo();
  const surahName = useSurahName();
  if (!riwayah.log.length) {
    return (
      <p className="rounded-2xl border border-dashed p-6 text-center text-sm leading-relaxed text-muted-foreground">
        {t("hifz.noHistory")}
      </p>
    );
  }
  const days: { day: number; entries: HifzLogEntry[] }[] = [];
  for (const e of riwayah.log) {
    const day = startOfDay(e.at);
    if (days.at(-1)?.day === day) days.at(-1)!.entries.push(e);
    else days.push({ day, entries: [e] });
  }
  return (
    <div className="space-y-4">
      {days.map(({ day, entries }) => (
        <section key={day}>
          <h3 className="mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">{ago(day)}</h3>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {entries.map((e, i) => (
              <li key={i} className="flex items-center gap-3 px-4 py-2.5 text-sm">
                {e.kind === "memorized" ? (
                  <BookCheck className="tint-fg size-4 shrink-0" />
                ) : (
                  <RotateCcw className="size-4 shrink-0 text-muted-foreground" />
                )}
                <span className="min-w-0 flex-1 truncate">
                  {t(e.kind === "memorized" ? "hifz.memorized" : "hifz.revised")} ·{" "}
                  {e.juz ? (
                    <>
                      {t("hifz.juz", { n: num(e.juz) })}{" "}
                      <span className="text-muted-foreground">
                        {juzParts(e.juz, layout).map((p) => surahName(p.surah)).join(", ")}
                      </span>
                    </>
                  ) : (
                    <>
                      {surahName(e.surah)}{" "}
                      <span className="text-muted-foreground tabular-nums">
                        {e.from === e.to ? num(e.from) : `${num(e.from)}–${num(e.to)}`}
                      </span>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  onClick={() => hifz.removeLogEntry(mushaf.id, e)}
                  aria-label={t("hifz.removeEntry")}
                  title={t("hifz.removeEntry")}
                  className="rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

export default function HifzPage({ loaderData }: Route.ComponentProps) {
  const mushaf = getMushaf(loaderData.mushafId)!;
  const { pages } = loaderData;
  const layout: HifzLayout = { pages, juzStarts: loaderData.juzStarts };
  const [logged, setLogged] = useState<Logged | null>(null);
  const dismiss = useCallback(() => setLogged(null), []);
  const { l, t, num, isAr } = useLocalize();
  const riwayah = useHifz(mushaf.id);
  const category = categoryOf("hifz", mushaf.id);

  let memorized = 0;
  let complete = 0;
  let weak = 0;
  let transitions = 0;
  for (const [i, p] of pages.entries()) {
    const s = surahHifz(riwayah, i + 1, p.length);
    memorized += s.memorized;
    weak += s.weak;
    transitions += s.transitions;
    if (s.memorized === p.length) complete++;
  }
  const pct = (memorized / mushaf.ayahs) * 100;

  return (
    <div style={{ "--hue": mushaf.hue } as React.CSSProperties} className="mx-auto max-w-3xl space-y-6">
      {category && <BackLink to={itemInfo({ kind: "category", id: category.id }).to}>{l(category.name)}</BackLink>}

      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8 rtl:bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)]">
        <p className="text-sm text-gold">{t("hifz.title")}</p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{l(mushaf.name)}</h1>
        {!isAr && (
          <p lang="ar" className="font-arabic mt-1 text-xl text-muted-foreground">
            {mushaf.name.ar}
          </p>
        )}
        <div className="mt-5 flex items-baseline justify-between gap-3">
          <p className="text-sm">
            <span className="text-2xl font-semibold tabular-nums">{num(memorized)}</span>
            <span className="text-muted-foreground"> / {t("quran.ayahs", { count: mushaf.ayahs })}</span>
          </p>
          <p className="tint-fg text-sm font-medium tabular-nums">{num(Math.floor(pct * 10) / 10)}%</p>
        </div>
        <Progress value={pct} className="tint-bg *:tint-solid mt-2 h-2" />
        <p className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <span>{t("hifz.surahsComplete", { count: complete })}</span>
          <span className={cn(weak > 0 && "text-amber-500")}>{t("hifz.weakCount", { count: weak })}</span>
          <span className={cn(transitions > 0 && "text-amber-500")}>{t("hifz.transitionCount", { count: transitions })}</span>
        </p>
      </header>

      <LogPanel mushafId={mushaf.id} hue={mushaf.hue} layout={layout} riwayah={riwayah} onLogged={setLogged} />

      <Tabs defaultValue="surahs" dir={isAr ? "rtl" : "ltr"}>
        <TabsList>
          <TabsTrigger value="surahs">{t("quran.surahsTitle")}</TabsTrigger>
          <TabsTrigger value="weak">
            {t("hifz.weakSpots")}
            {weak + transitions > 0 && <span className="text-xs text-amber-500 tabular-nums">{num(weak + transitions)}</span>}
          </TabsTrigger>
          <TabsTrigger value="history">{t("hifz.history")}</TabsTrigger>
        </TabsList>
        <TabsContent value="surahs" className="mt-4">
          <SurahList mushaf={mushaf} pages={pages} riwayah={riwayah} onLogged={setLogged} />
        </TabsContent>
        <TabsContent value="weak" className="mt-4">
          <WeakSpots mushaf={mushaf} pages={pages} riwayah={riwayah} />
        </TabsContent>
        <TabsContent value="history" className="mt-4">
          <History mushaf={mushaf} layout={layout} riwayah={riwayah} />
        </TabsContent>
      </Tabs>
      {/* Keyed, so a new log restarts its timer. */}
      <UndoToast key={logged?.message} logged={logged} onDone={dismiss} />
    </div>
  );
}
