import { cn } from "cn";
import { BookOpen, FileText, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { href, Link, useNavigate } from "react-router";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "~/components/ui/dialog";
import type { Mushaf } from "~/data/mushafs";
import { type QuranHit, type QuranSearch, quranSearchSource } from "~/data/quran-search";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";

const answers = new Map<string, Promise<QuranSearch>>();
function fetchSearch(url: string) {
  let answer = answers.get(url);
  if (!answer) {
    answer = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json() as Promise<QuranSearch>;
    });
    answer.catch(() => answers.delete(url));
    answers.set(url, answer);
  }
  return answer;
}

/** The search's answer for a query, a moment after typing stops (null until then, or with no query). */
function useQuranSearch(mushafId: string, query: string) {
  const q = query.trim();
  const url = q ? `${href("/api/loaders/mushaf/:mushafId/search", { mushafId })}?q=${encodeURIComponent(q)}` : null;
  const [answer, setAnswer] = useState<{ url: string; result: QuranSearch } | null>(null);
  useEffect(() => {
    if (!url) return;
    let live = true;
    const timer = setTimeout(() => {
      fetchSearch(url).then(
        (result) => live && setAnswer({ url, result }),
        () => {},
      );
    }, 200);
    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [url]);
  // The last answer stays up while the next one loads, so the list doesn't flash empty between keys.
  return url ? (answer?.result ?? null) : null;
}

/** Where a hit opens: its page, at the ayah (highlighted there) or the surah. */
export function hitLink(mushafId: string, hit: QuranHit) {
  const page = (n: number) => href("/mushaf/:mushafId/page/:page", { mushafId, page: String(n) });
  if (hit.kind === "ayah") return `${page(hit.page)}#ayah-${hit.surah}-${hit.n}`;
  if (hit.kind === "surah") return `${page(hit.page)}#surah-${hit.surah}`;
  if (hit.kind === "page") return page(hit.page);
  return null;
}

/**
 * The results of a Qur'an search in one riwayah: the ayah or page asked for, surahs (unless the
 * page lists them itself), then the ayat containing the words. Enter in the box opens the first.
 */
export function QuranSearchResults({
  mushaf,
  query,
  withSurahs = true,
  showNone = withSurahs,
  onPick,
  className,
}: {
  mushaf: Mushaf;
  query: string;
  /** Off where the page lists the matching surahs itself. */
  withSurahs?: boolean;
  /** Say so when nothing matches (off where the page has other results to show). */
  showNone?: boolean;
  onPick?: () => void;
  /** For the results' box, when there are any. */
  className?: string;
}) {
  const { t, num, isAr } = useLocalize();
  const result = useQuranSearch(mushaf.id, query);
  if (!result) return null;
  const hits = result.hits.filter((h) => withSurahs || h.kind !== "surah");
  const refs = hits.filter((h) => h.kind !== "ayah" || result.wordMatches === 0);
  const words = result.wordMatches ? hits.filter((h) => h.kind === "ayah") : [];
  if (!hits.length) {
    return showNone ? <p className="px-4 py-6 text-center text-sm text-muted-foreground">{t("search.none")}</p> : null;
  }

  const surahName = (n: number) => (isAr ? `سورة ${surahs[n - 1].name}` : surahs[n - 1].translit);
  const row = "flex items-start gap-3 px-4 py-3 transition-colors outline-none hover:bg-accent/50 focus-visible:bg-accent/60";
  const item = (hit: QuranHit, i: number) => {
    const to = hitLink(mushaf.id, hit);
    if (hit.kind === "missing" || !to) {
      return (
        <li key={i} className="px-4 py-3 text-sm text-muted-foreground">
          {t("search.missing", {
            surah: surahName(hit.surah),
            ayahs: t("quran.ayahs", { count: hit.kind === "missing" ? hit.ayahs : 0 }),
          })}
        </li>
      );
    }
    const Icon = hit.kind === "page" ? FileText : BookOpen;
    return (
      <li key={i}>
        <Link to={to} onClick={onPick} className={row}>
          {hit.kind === "ayah" ? (
            <span className="tint-bg tint-fg mt-0.5 flex h-7 min-w-7 shrink-0 items-center justify-center rounded-full px-1.5 text-xs tabular-nums">
              {num(hit.n)}
            </span>
          ) : (
            <Icon className="tint-fg mt-1 size-4 shrink-0" />
          )}
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-3 text-sm">
              <span className="truncate font-medium">
                {hit.kind === "page"
                  ? `${t("mushaf.page", { n: num(hit.page) })} · ${surahName(hit.surah)}`
                  : hit.kind === "surah"
                    ? surahName(hit.surah)
                    : `${surahName(hit.surah)} · ${t("mushaf.ayah", { n: num(hit.n) })}`}
              </span>
              {hit.kind !== "page" && (
                <span className="shrink-0 text-xs text-muted-foreground tabular-nums">
                  {t("mushaf.page", { n: num(hit.page) })}
                </span>
              )}
            </span>
            {hit.kind === "ayah" && (
              <span lang="ar" dir="rtl" className="font-uthmani mt-1 line-clamp-2 block text-lg leading-loose text-foreground/90">
                {hit.text}
              </span>
            )}
          </span>
        </Link>
      </li>
    );
  };

  return (
    <div style={{ "--hue": mushaf.hue } as React.CSSProperties} className={className}>
      {refs.length > 0 && <ul className="divide-y">{refs.map(item)}</ul>}
      {words.length > 0 && (
        <>
          <p className={cn("flex items-baseline justify-between gap-3 px-4 pt-3 pb-1 text-xs text-muted-foreground", refs.length && "border-t")}>
            <span>
              {t("search.wordMatches", { n: num(result.wordMatches) })}
              {result.wordMatches > words.length && ` · ${t("search.firstShown", { n: num(words.length) })}`}
            </span>
            <a href={quranSearchSource.url} target="_blank" rel="noreferrer" className="shrink-0 hover:text-foreground">
              {quranSearchSource.name}
            </a>
          </p>
          <ul className="divide-y">{words.map((h, i) => item(h, refs.length + i))}</ul>
        </>
      )}
    </div>
  );
}

/** The search box's input: Enter opens the first result. */
export function QuranSearchInput({
  mushaf,
  value,
  onChange,
  onPick,
  autoFocus,
  className,
}: {
  mushaf: Mushaf;
  value: string;
  onChange: (q: string) => void;
  onPick?: () => void;
  autoFocus?: boolean;
  className?: string;
}) {
  const { t } = useLocalize();
  const navigate = useNavigate();
  return (
    <label
      className={cn(
        "flex cursor-text items-center gap-2 rounded-xl border bg-card px-3 focus-within:ring-2 focus-within:ring-ring/50",
        className,
      )}
    >
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        type="search"
        value={value}
        autoFocus={autoFocus}
        // The last search is kept, selected: typing replaces it, or its results are still there to pick from.
        onFocus={(e) => e.currentTarget.select()}
        onChange={(e) => onChange(e.currentTarget.value)}
        onKeyDown={async (e) => {
          if (e.key !== "Enter" || !value.trim()) return;
          e.preventDefault();
          const url = `${href("/api/loaders/mushaf/:mushafId/search", { mushafId: mushaf.id })}?q=${encodeURIComponent(value.trim())}`;
          const first = (await fetchSearch(url).catch(() => null))?.hits.map((h) => hitLink(mushaf.id, h)).find(Boolean);
          if (!first) return;
          onPick?.();
          navigate(first);
        }}
        placeholder={t("search.placeholder")}
        aria-label={t("search.placeholder")}
        enterKeyHint="go"
        className="h-10 min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

/** The search over the muṣḥaf page: a box at the top of the screen with its results under it. */
export function QuranSearchDialog({
  mushaf,
  open,
  onOpenChange,
}: {
  mushaf: Mushaf;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { t, isAr } = useLocalize();
  const [query, setQuery] = useState("");
  const close = () => onOpenChange(false);
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        closeLabel={t("settings.close")}
        className="top-[max(env(safe-area-inset-top),0.75rem)] flex max-h-[min(85dvh,44rem)] translate-y-0 flex-col gap-0 overflow-hidden p-0 sm:top-[12dvh]"
      >
        <DialogTitle className="sr-only">{t("search.title")}</DialogTitle>
        <DialogDescription className="sr-only">{t("search.hint")}</DialogDescription>
        <div className="border-b p-3 pe-12">
          <QuranSearchInput mushaf={mushaf} value={query} onChange={setQuery} onPick={close} autoFocus className="bg-background" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {query.trim() ? (
            <QuranSearchResults mushaf={mushaf} query={query} onPick={close} />
          ) : (
            <p className="px-4 py-5 text-sm leading-relaxed text-muted-foreground">{t("search.hint")}</p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
