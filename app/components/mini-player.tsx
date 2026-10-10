import { cn } from "cn";
import { Pause, Play, RotateCcw, RotateCw, X } from "lucide-react";
import { Link } from "react-router";
import { Spinner, useClock } from "~/components/audio-lesson";
import { BACK, FORWARD, player, usePlayer, useMiniPlayerVisible } from "~/lib/player";
import { useLocalize } from "~/lib/localize";

/**
 * Compact player that follows the listener around the app while a recording is loaded and its
 * full player isn't on the page. On phones it sits above the tab bar; on desktop it floats at
 * the bottom of the content. Tapping the title goes back to the recording's page.
 */
export function MiniPlayer() {
  const s = usePlayer();
  const visible = useMiniPlayerVisible();
  const { l, t, num, isAr } = useLocalize();
  const clock = useClock();
  const track = s.track;
  if (!visible || !track) return null;

  const pct = s.duration ? (s.time / s.duration) * 100 : 0;
  const busy = s.status === "loading" || s.buffering;
  const ready = s.status === "ready";
  const title = isAr ? track.book.title.ar : l(track.book.title);
  // A surah's label repeats its title ("Surah al-Ikhlāṣ"), so just the reciter then.
  const subtitle = track.label.includes(title) || title.includes(track.label) ? track.artist : `${track.artist} · ${track.label}`;

  return (
    <div className="lg:px-6 lg:pb-4">
      <div
        style={{ "--hue": track.hue } as React.CSSProperties}
        className="relative mx-auto overflow-hidden border-t bg-[oklch(0.17_0.02_var(--hue)/0.92)] backdrop-blur-xl lg:max-w-3xl lg:rounded-2xl lg:border lg:shadow-2xl lg:shadow-black/50"
      >
        {/* Progress along the top edge. */}
        <div className="absolute inset-x-0 top-0 h-0.5 bg-white/10">
          <div className="tint-solid h-full transition-[width] duration-300" style={{ width: `${pct}%` }} />
        </div>

        <div className="flex items-center gap-2 px-3 py-2 sm:gap-3 sm:px-4">
          <Link
            to={track.href}
            aria-label={`${t("player.open")}: ${title}`}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            {/* Artwork (if any) with an equaliser that moves while the recording plays. */}
            <span
              aria-hidden
              className="tint-bg relative flex size-10 shrink-0 items-end justify-center gap-0.75 overflow-hidden rounded-lg px-2.5 py-2.5"
            >
              {track.artwork && (
                <>
                  <img src={track.artwork} alt="" className="absolute inset-0 size-full object-cover" />
                  <span className="absolute inset-x-0 bottom-0 h-3/5 bg-linear-to-t from-black/70 to-transparent" />
                </>
              )}
              {[0, 0.35, 0.15, 0.5].map((delay, i) => (
                <span
                  key={i}
                  style={{ animationDelay: `${delay}s` }}
                  className={cn(
                    "tint-solid relative w-0.75 origin-bottom rounded-full transition-transform",
                    track.artwork ? "h-2/5" : "h-full",
                    s.playing && !s.buffering ? "motion-safe:animate-eq" : "scale-y-30",
                  )}
                />
              ))}
            </span>
            <span className="min-w-0">
              <span
                lang={isAr ? "ar" : undefined}
                className={cn("block truncate text-sm font-medium", isAr && "font-arabic text-base leading-tight")}
              >
                {title}
              </span>
              <span className="block truncate text-xs text-muted-foreground">
                {subtitle}
                {s.duration > 0 && (
                  <span className="max-sm:hidden">
                    {" "}
                    · <span dir="ltr" className="tabular-nums">{clock(s.time)} / {clock(s.duration)}</span>
                  </span>
                )}
              </span>
            </span>
          </Link>

          <button
            type="button"
            onClick={() => player.skip(-BACK)}
            disabled={!ready}
            aria-label={t("watch.back", { s: num(BACK) })}
            title={t("watch.back", { s: num(BACK) })}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40 max-sm:hidden"
          >
            <RotateCcw className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={() => (s.status === "error" ? player.retry() : player.toggle())}
            disabled={s.status === "loading"}
            aria-label={s.playing ? t("watch.pause") : t("watch.play")}
            className="relative flex size-10 shrink-0 items-center justify-center rounded-full bg-[oklch(0.93_0.05_var(--hue))] text-[oklch(0.2_0.05_var(--hue))] transition-[scale,opacity] hover:scale-105 active:scale-95 disabled:opacity-60"
          >
            {s.playing ? <Pause className="size-4.5 fill-current" /> : <Play className="size-4.5 translate-x-px fill-current" />}
            {busy && <Spinner />}
          </button>
          <button
            type="button"
            onClick={() => player.skip(FORWARD)}
            disabled={!ready}
            aria-label={t("watch.forward", { s: num(FORWARD) })}
            title={t("watch.forward", { s: num(FORWARD) })}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground disabled:opacity-40 max-sm:hidden"
          >
            <RotateCw className="size-4.5" />
          </button>
          <button
            type="button"
            onClick={() => player.stop()}
            aria-label={t("player.close")}
            title={t("player.close")}
            className="flex size-9 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-white/10 hover:text-foreground"
          >
            <X className="size-4.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
