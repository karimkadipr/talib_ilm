import { cn } from "cn";
import { ArrowUpRight, Check, Copy, X } from "lucide-react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { href } from "react-router";
import { englishTafsirUrl, type Mushaf, type Tafsir, type TafsirPart, tafsirs, tafsirUrl } from "~/data/mushafs";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";

export type SelectedAyah = {
  surah: number;
  n: number;
  /** Its number in Ḥafṣ's count, which the tafsir links use. */
  hafs: number;
  /** Every Ḥafṣ ayah it holds, whose tafsir it shows. */
  hafsAyahs: number[];
  /** The ayah's words, without its number. */
  words: string;
  /** The in-app tafsirs sent with the page (by tafsir id); the others are fetched. */
  tafsir: Record<string, TafsirPart[]>;
};

/** Tafsirs read in the app, offered as tabs; the others are links. */
const inApp = tafsirs.filter((t) => t.source);

/** The tafsir tab last read, so a reader of as-Saʿdī gets as-Saʿdī on the next ayah too. */
const TAB_KEY = "islamic-studies:tafsir-tab:v1";

const fetched = new Map<string, Promise<TafsirPart[]>>();
function fetchTafsir(url: string) {
  let parts = fetched.get(url);
  if (!parts) {
    parts = fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${r.status} ${url}`);
      return r.json() as Promise<TafsirPart[]>;
    });
    // A failed fetch can be tried again.
    parts.catch(() => fetched.delete(url));
    fetched.set(url, parts);
  }
  return parts;
}

/**
 * A tafsir's paragraphs, with the Qur'an words it quotes set off in the riwayah's colour (in ﴿ ﴾ for a
 * tafsir that marks them with braces) and its ayah markers ({12}) as numbered badges.
 */
function TafsirText({ text, quotes }: { text: string; quotes: Tafsir["quotes"] }) {
  const { num } = useLocalize();
  const pattern = quotes === "{}" ? /(\{[^{}]*\})/ : /(\([^()]*[ء-ي][^()]*\))/;
  return text.split("\n").map((paragraph, i) => (
    <p key={i}>
      {paragraph.split(pattern).map((part, j) => {
        if (j % 2 === 0) return part;
        if (quotes !== "{}") return <span key={j} className="tint-fg">{part}</span>;
        const mark = part.match(/^\{(\d+)\}$/);
        return mark ? (
          <span
            key={j}
            data-mark={mark[1]}
            className="tint-bg tint-fg mx-0.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full px-1 align-middle font-sans text-[0.7rem] leading-none"
          >
            {num(Number(mark[1]))}
          </span>
        ) : (
          <span key={j} className="tint-fg">
            ﴿{part.slice(1, -1).trim()}﴾
          </span>
        );
      })}
    </p>
  ));
}

/**
 * A tapped ayah's tafsir (al-Muyassar or as-Saʿdī, kept in the app), links to other tafsirs, and copying
 * it. A panel docked to the top or bottom edge away from the ayah rather than a popover over the text,
 * so it never covers the ayah it's about; the page stays usable to pick another one.
 */
export function AyahActions({
  mushaf,
  ayah,
  side,
  anchor,
  onClose,
}: {
  mushaf: Mushaf;
  ayah: SelectedAyah;
  side: "top" | "bottom";
  /** Where the ayah is on screen (viewport px), so the panel stops short of it. */
  anchor: { top: number; bottom: number };
  onClose: () => void;
}) {
  const { l, t, num, isAr } = useLocalize();
  const [copied, setCopied] = useState(false);
  const surah = surahs[ayah.surah - 1];
  const panel = useRef<HTMLDivElement>(null);
  const body = useRef<HTMLDivElement>(null);

  // The panel only opens on a tap, never on the server, so storage can be read straight away.
  const [tab, setTab] = useState(() => {
    try {
      const saved = localStorage.getItem(TAB_KEY);
      if (inApp.some((x) => x.id === saved)) return saved!;
    } catch {
      // Storage blocked: start on the first tab.
    }
    return inApp[0].id;
  });
  const tafsir = inApp.find((x) => x.id === tab)!;
  function choose(id: string) {
    setTab(id);
    try {
      localStorage.setItem(TAB_KEY, id);
    } catch {
      // Storage blocked: the choice lasts until the panel closes.
    }
  }

  const preloaded = ayah.tafsir[tab];
  const url = preloaded
    ? null
    : `${href("/api/loaders/tafsir/:tafsirId/:surah", { tafsirId: tab, surah: String(ayah.surah) })}?ayahs=${ayah.hafsAyahs.join(",")}`;
  const [loaded, setLoaded] = useState<{ url: string; parts?: TafsirPart[]; failed?: boolean } | null>(null);
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    if (!url) return;
    let live = true;
    fetchTafsir(url).then(
      (parts) => live && setLoaded({ url, parts }),
      () => live && setLoaded({ url, failed: true }),
    );
    return () => {
      live = false;
    };
  }, [url, attempt]);
  const current = loaded?.url === url ? loaded : null;
  const parts = preloaded ?? current?.parts;

  // As tall as the room between its docked edge and the ayah (the tafsir scrolls inside), but never
  // so short it's unusable when the ayah fills most of the screen.
  useLayoutEffect(() => {
    const el = panel.current;
    if (!el) return;
    // From its CSS offset, not its box, which is still mid slide-in.
    const s = getComputedStyle(el);
    const room =
      side === "bottom" ? window.innerHeight - parseFloat(s.bottom) - anchor.bottom : anchor.top - parseFloat(s.top);
    el.style.maxHeight = `${Math.max(room - 8, 240)}px`;
  }, [side, anchor]);

  // A tafsir explaining several ayat together opens where this one's explanation starts.
  useLayoutEffect(() => {
    const el = body.current;
    if (!el) return;
    const mark = el.querySelector<HTMLElement>(`[data-mark="${ayah.hafsAyahs[0]}"]`);
    // (The body is the marks' offset parent.)
    el.scrollTop = mark ? mark.offsetTop - 4 : 0;
  }, [parts, ayah.hafsAyahs]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => setCopied(false), [ayah.surah, ayah.n]);

  async function copy() {
    const ref = `${surah.name}: ${isAr ? ayah.n.toLocaleString("ar-EG") : ayah.n}`;
    const riwayah = mushaf.id === "hafs" ? "" : `، ${mushaf.name.ar}`;
    try {
      await navigator.clipboard.writeText(`﴿${ayah.words.trim()}﴾ [${ref}${riwayah}]`);
      setCopied(true);
    } catch {
      // Clipboard blocked (e.g. an insecure context): nothing to confirm.
    }
  }

  /** Which ayat a part explains, when that isn't just the tapped one. */
  function partLabel(p: TafsirPart) {
    if (p.from === p.to && (parts?.length ?? 0) < 2) return null;
    const hafs = mushaf.id !== "hafs";
    if (p.from === p.to) return t(hafs ? "mushaf.hafsAyah" : "mushaf.ayah", { n: num(p.from) });
    return t(hafs ? "mushaf.hafsAyahs" : "mushaf.ayahRange", { from: num(p.from), to: num(p.to) });
  }

  const chip =
    "inline-flex items-center gap-1 rounded-full border bg-background/40 px-3 py-1.5 text-sm transition-colors hover:bg-accent";
  const iconButton =
    "rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

  return (
    <div
      ref={panel}
      role="dialog"
      aria-label={`${isAr ? surah.name : surah.translit} · ${t("mushaf.ayah", { n: num(ayah.n) })}`}
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "tint-border fixed inset-x-3 z-50 flex flex-col rounded-2xl border bg-popover p-4 shadow-2xl duration-200 animate-in fade-in",
        side === "bottom"
          ? "bottom-[max(env(safe-area-inset-bottom),0.75rem)] slide-in-from-bottom-4 lg:bottom-6"
          : "top-[max(env(safe-area-inset-top),0.75rem)] slide-in-from-top-4 lg:top-20",
        // Wide screens: as wide as the page and centred over it (beside the sidebar), below the header.
        "lg:inset-s-80 lg:inset-e-0 lg:mx-auto lg:max-w-2xl",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-medium">
            {isAr ? `سورة ${surah.name}` : surah.translit} · {t("mushaf.ayah", { n: num(ayah.n) })}
          </p>
          {/* With several Ḥafṣ ayat, each part of the tafsir is labelled instead. */}
          {ayah.hafs !== ayah.n && ayah.hafsAyahs.length < 2 && (
            <p className="mt-0.5 text-xs text-muted-foreground">{t("mushaf.hafsCount", { n: num(ayah.hafs) })}</p>
          )}
        </div>
        <div className="-me-1.5 -mt-1 flex shrink-0 items-center">
          <button type="button" onClick={copy} aria-label={t("mushaf.copy")} title={t("mushaf.copy")} className={iconButton}>
            {copied ? <Check className="tint-fg size-4" /> : <Copy className="size-4" />}
          </button>
          <button type="button" onClick={onClose} aria-label={t("settings.close")} className={iconButton}>
            <X className="size-4" />
          </button>
        </div>
      </div>
      {copied && (
        <p role="status" className="tint-fg -mt-1 text-xs">
          {t("mushaf.copied")}
        </p>
      )}

      <div className="mt-3 flex items-center justify-between gap-3">
        <div role="tablist" aria-label={t("mushaf.tafsir")} className="flex gap-0.5 rounded-full border bg-background/40 p-0.5">
          {inApp.map((x) => (
            <button
              key={x.id}
              type="button"
              role="tab"
              aria-selected={x.id === tab}
              onClick={() => choose(x.id)}
              className={cn(
                "rounded-full px-3 py-1 text-sm transition-colors",
                x.id === tab ? "tint-solid" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {isAr ? (
                <span lang="ar" className="font-arabic">
                  {x.name.ar}
                </span>
              ) : (
                l(x.name)
              )}
            </button>
          ))}
        </div>
        <a
          href={tafsir.source!.url}
          target="_blank"
          rel="noreferrer"
          className="shrink-0 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {tafsir.source!.name}
        </a>
      </div>
      {/* Scrolls inside the panel, so a long one never grows it over the ayah. */}
      <div
        ref={body}
        role="tabpanel"
        lang="ar"
        dir="rtl"
        className="font-arabic relative mt-2 max-h-[45dvh] min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain text-[1.05rem] leading-loose"
      >
        {parts ? (
          parts.map((p) => (
            <div key={p.from} className="space-y-2">
              {partLabel(p) && (
                <p dir={isAr ? "rtl" : "ltr"} className="font-sans text-xs text-muted-foreground">
                  {partLabel(p)}
                </p>
              )}
              <TafsirText text={p.text} quotes={tafsir.quotes} />
            </div>
          ))
        ) : current?.failed ? (
          <p dir={isAr ? "rtl" : "ltr"} className="font-sans text-sm text-muted-foreground">
            {t("mushaf.tafsirFailed")}{" "}
            <button type="button" onClick={() => setAttempt((n) => n + 1)} className="text-primary hover:underline">
              {t("watch.retry")}
            </button>
          </p>
        ) : (
          <div aria-busy className="space-y-3 py-1">
            {[100, 92, 96, 60].map((w) => (
              <div key={w} className="h-3.5 animate-pulse rounded-full bg-muted" style={{ width: `${w}%` }} />
            ))}
          </div>
        )}
      </div>

      <p className="mt-3 mb-1.5 text-xs text-muted-foreground">{t("mushaf.moreTafsirs")}</p>
      <div className="flex flex-wrap gap-2">
        {tafsirs
          .filter((x) => !x.source)
          .map((x) => (
            <a key={x.id} href={tafsirUrl(x.id, ayah.surah, ayah.hafs)} target="_blank" rel="noreferrer" className={chip}>
              {isAr ? (
                <span lang="ar" className="font-arabic">
                  {x.name.ar}
                </span>
              ) : (
                l(x.name)
              )}
              <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
            </a>
          ))}
        {!isAr && (
          <a href={englishTafsirUrl(ayah.surah, ayah.hafs)} target="_blank" rel="noreferrer" className={chip}>
            {t("mushaf.tafsirEnglish")}
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
          </a>
        )}
      </div>
    </div>
  );
}
