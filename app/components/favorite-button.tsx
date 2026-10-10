import { cn } from "cn";
import { Heart } from "lucide-react";
import { quranFavorites, useQuranFavorites } from "~/lib/quran-favorites";
import { useLocalize } from "~/lib/localize";

/** Heart that adds or removes a reciter's surah from the listener's favourites. */
export function FavoriteButton({
  reciterId,
  surah,
  name,
  className,
}: {
  reciterId: string;
  surah: number;
  /** Surah name for the button's accessible label. */
  name: string;
  className?: string;
}) {
  const { t } = useLocalize();
  const on = useQuranFavorites()[reciterId]?.includes(surah) ?? false;
  const label = `${on ? t("quran.unfavorite") : t("quran.favorite")}: ${name}`;
  return (
    <button
      type="button"
      onClick={() => quranFavorites.toggle(reciterId, surah)}
      aria-pressed={on}
      aria-label={label}
      title={label}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full transition-[color,background-color,scale] hover:bg-accent active:scale-90",
        on ? "text-rose-400" : "text-muted-foreground hover:text-foreground",
        className,
      )}
    >
      <Heart className={cn("size-4.5", on && "fill-current")} />
    </button>
  );
}
