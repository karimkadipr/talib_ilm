import { cn } from "cn";
import { ArrowUpRight, Check, Copy, X } from "lucide-react";
import { useEffect, useState } from "react";
import { englishTafsirUrl, type Mushaf, tafsirs, tafsirUrl } from "~/data/mushafs";
import { surahs } from "~/data/surahs";
import { useLocalize } from "~/lib/localize";

export type SelectedAyah = {
  surah: number;
  n: number;
  /** Its number in Ḥafṣ's count, which the tafsir links use. */
  hafs: number;
  /** The ayah's words, without its number. */
  words: string;
};

/**
 * What can be done with a tapped ayah: open it in a tafsir, or copy it. A panel docked to the top or
 * bottom edge away from the ayah rather than a popover over the text, so it never covers the ayah
 * it's about; the page stays usable to pick another one.
 */
export function AyahActions({
  mushaf,
  ayah,
  side,
  onClose,
}: {
  mushaf: Mushaf;
  ayah: SelectedAyah;
  side: "top" | "bottom";
  onClose: () => void;
}) {
  const { l, t, num, isAr } = useLocalize();
  const [copied, setCopied] = useState(false);
  const surah = surahs[ayah.surah - 1];

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => setCopied(false), [ayah.surah, ayah.n]);

  async function copy() {
    const ref = `${surah.name}: ${ayah.n.toLocaleString("ar-EG")}`;
    const riwayah = mushaf.id === "hafs" ? "" : `، ${mushaf.name.ar}`;
    try {
      await navigator.clipboard.writeText(`﴿${ayah.words.trim()}﴾ [${ref}${riwayah}]`);
      setCopied(true);
    } catch {
      // Clipboard blocked (e.g. an insecure context): nothing to confirm.
    }
  }

  const tile =
    "flex items-center justify-between gap-2 rounded-xl border bg-background/40 px-3 py-2 text-sm transition-colors hover:bg-accent";

  return (
    <div
      role="dialog"
      aria-label={`${isAr ? surah.name : surah.translit} · ${t("mushaf.ayah", { n: num(ayah.n) })}`}
      dir={isAr ? "rtl" : "ltr"}
      className={cn(
        "tint-border fixed inset-x-3 z-50 rounded-2xl border bg-popover p-4 shadow-2xl duration-200 animate-in fade-in",
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
          {ayah.hafs !== ayah.n && (
            <p className="mt-0.5 text-xs text-muted-foreground">{t("mushaf.hafsCount", { n: num(ayah.hafs) })}</p>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={t("settings.close")}
          className="-me-1.5 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <X className="size-4" />
        </button>
      </div>

      <p className="mt-3 mb-2 text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {isAr ? t("mushaf.tafsir") : t("mushaf.tafsirArabic")}
      </p>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {tafsirs.map((tafsir) => (
          <a
            key={tafsir.id}
            href={tafsirUrl(tafsir.id, ayah.surah, ayah.hafs)}
            target="_blank"
            rel="noreferrer"
            className={tile}
          >
            <span className="min-w-0">
              <span lang="ar" className="font-arabic block truncate">
                {tafsir.name.ar}
              </span>
              {!isAr && <span className="block truncate text-xs text-muted-foreground">{l(tafsir.name)}</span>}
            </span>
            <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground rtl:-scale-x-100" />
          </a>
        ))}
      </div>
      {!isAr && (
        <a href={englishTafsirUrl(ayah.surah, ayah.hafs)} target="_blank" rel="noreferrer" className={cn(tile, "mt-2")}>
          {t("mushaf.tafsirEnglish")}
          <ArrowUpRight className="size-3.5 shrink-0 text-muted-foreground" />
        </a>
      )}

      <button
        type="button"
        onClick={copy}
        className="mt-3 inline-flex items-center gap-1.5 rounded-full px-1 py-0.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        {copied ? <Check className="tint-fg size-4" /> : <Copy className="size-4" />}
        {copied ? t("mushaf.copied") : t("mushaf.copy")}
      </button>
    </div>
  );
}
