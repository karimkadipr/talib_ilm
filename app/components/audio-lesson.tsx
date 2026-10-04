import { cn } from "cn";
import { AlertTriangle, ExternalLink, Pause, Play, RotateCcw, RotateCw } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookCover } from "~/components/book-cover";
import type { Book } from "~/data/curriculum";

const SPEEDS = [1, 1.25, 1.5, 2];
const BACK = 15;
const FORWARD = 30;
const POSITION_KEY = (id: string) => `islamic-studies:position:${id}`;

function readPosition(id: string) {
  try {
    return Number(localStorage.getItem(POSITION_KEY(id))) || 0;
  } catch {
    return 0;
  }
}

function writePosition(id: string, seconds: number) {
  try {
    if (seconds > 0) localStorage.setItem(POSITION_KEY(id), String(Math.floor(seconds)));
    else localStorage.removeItem(POSITION_KEY(id));
  } catch {
    // Storage blocked: the lesson just restarts from the beginning next time.
  }
}

/** h:mm:ss (or m:ss) in the page language's digits. */
function useClock() {
  const { i18n } = useTranslation();
  const one = new Intl.NumberFormat(i18n.language, { useGrouping: false });
  const two = new Intl.NumberFormat(i18n.language, { minimumIntegerDigits: 2, useGrouping: false });
  return (seconds: number) => {
    const total = Math.max(0, Math.floor(seconds));
    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const s = total % 60;
    return h ? `${one.format(h)}:${two.format(m)}:${two.format(s)}` : `${one.format(m)}:${two.format(s)}`;
  };
}

type Status = "loading" | "ready" | "error";

/**
 * Audio lesson player. Remembers where you stopped in each lesson (they run
 * 1–1½ hours), shows loading/buffering/error states, and reports when the
 * recording finishes.
 */
export function AudioLesson({
  id,
  src,
  book,
  hue,
  artist,
  label,
  onEnded,
}: {
  /** Stable lesson key, used to remember the playback position. */
  id: string;
  src: string;
  book: Book;
  hue: number;
  /** Scholar's name, shown on the lock screen / media controls. */
  artist: string;
  /** e.g. "Lesson 3", shown on the lock screen / media controls. */
  label: string;
  onEnded: () => void;
}) {
  const { t, i18n } = useTranslation();
  const clock = useClock();
  const audio = useRef<HTMLAudioElement>(null);
  const lastSaved = useRef(0);
  const restored = useRef(false);
  const dragging = useRef(false);

  const [status, setStatus] = useState<Status>("loading");
  const [playing, setPlaying] = useState(false);
  const [buffering, setBuffering] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const [speed, setSpeed] = useState(1);
  const [resumedAt, setResumedAt] = useState<number | null>(null);

  function onMetadata(el: HTMLAudioElement) {
    setDuration(el.duration);
    setStatus("ready");
    if (restored.current) return;
    restored.current = true;
    const at = readPosition(id);
    if (at && at < el.duration - 5) {
      el.currentTime = at;
      setTime(at);
      setResumedAt(at);
    }
  }

  function updateBuffered(el: HTMLAudioElement) {
    const ranges = el.buffered;
    for (let i = 0; i < ranges.length; i++) {
      if (ranges.start(i) <= el.currentTime && el.currentTime <= ranges.end(i)) {
        setBuffered(ranges.end(i));
        return;
      }
    }
  }

  // The element may have loaded (or failed) before hydration attached the
  // event handlers, so pick up its current state once on mount.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    if (el.error) setStatus("error");
    else if (el.readyState >= 1) onMetadata(el);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  // Hide the "picked up where you left off" note after a while.
  useEffect(() => {
    if (resumedAt === null) return;
    const timer = setTimeout(() => setResumedAt(null), 8000);
    return () => clearTimeout(timer);
  }, [resumedAt]);

  const toggle = () => {
    const el = audio.current;
    if (!el || status !== "ready") return;
    if (el.paused) void el.play().catch(() => {});
    else el.pause();
  };

  const seekTo = (seconds: number) => {
    const el = audio.current;
    if (!el || !duration) return;
    el.currentTime = Math.min(Math.max(0, seconds), duration - 0.5);
    setTime(el.currentTime);
  };
  const skip = (delta: number) => audio.current && seekTo(audio.current.currentTime + delta);

  const retry = () => {
    const el = audio.current;
    if (!el) return;
    restored.current = false;
    setStatus("loading");
    el.load();
  };

  // Lock screen, headphones and media keys.
  useEffect(() => {
    if (!("mediaSession" in navigator) || typeof MediaMetadata === "undefined") return;
    const session = navigator.mediaSession;
    session.metadata = new MediaMetadata({ title: book.title.ar, artist, album: label });
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audio.current?.play().catch(() => {})],
      ["pause", () => audio.current?.pause()],
      ["seekbackward", (d) => skip(-(d.seekOffset ?? BACK))],
      ["seekforward", (d) => skip(d.seekOffset ?? FORWARD)],
      ["seekto", (d) => d.seekTime !== undefined && seekTo(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        session.setActionHandler(action, handler);
      } catch {
        // Action not supported by this browser.
      }
    }
    return () => {
      for (const [action] of handlers) {
        try {
          session.setActionHandler(action, null);
        } catch {}
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [book, artist, label, duration]);

  // Space / k: play-pause. ← / j: back. → / l: forward. Ignored while typing.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (target.closest("input, textarea, select, [contenteditable=true], [role=tab]")) return;
      // Space on a focused button already clicks it.
      if (e.key === " " && target.closest("button, a")) return;
      if (e.key === " " || e.key === "k") toggle();
      else if (e.key === "ArrowLeft" || e.key === "j") skip(-BACK);
      else if (e.key === "ArrowRight" || e.key === "l") skip(FORWARD);
      else return;
      e.preventDefault();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const numberFormat = new Intl.NumberFormat(i18n.language);
  const shown = scrub ?? time;
  const pct = duration ? (shown / duration) * 100 : 0;
  const bufferedPct = duration ? (buffered / duration) * 100 : 0;
  const loading = status === "loading";
  const busy = loading || buffering;

  const caption =
    status === "error"
      ? null
      : loading
        ? t("watch.loading")
        : buffering
          ? t("watch.buffering")
          : resumedAt !== null
            ? t("watch.resumedAt", { time: clock(resumedAt) })
            : playing
              ? t("watch.playing")
              : t("watch.paused");

  return (
    <div
      style={{ "--hue": hue } as React.CSSProperties}
      className="relative overflow-hidden rounded-3xl border bg-[radial-gradient(90%_130%_at_20%_0%,oklch(0.3_0.07_var(--hue)),oklch(0.14_0.012_var(--hue)))] rtl:bg-[radial-gradient(90%_130%_at_80%_0%,oklch(0.3_0.07_var(--hue)),oklch(0.14_0.012_var(--hue)))]"
    >
      <div className="bg-khatam absolute inset-0 opacity-60 mask-[linear-gradient(to_bottom,black,transparent)]" />

      <audio
        ref={audio}
        src={src}
        preload="metadata"
        onLoadedMetadata={(e) => onMetadata(e.currentTarget)}
        onDurationChange={(e) => Number.isFinite(e.currentTarget.duration) && setDuration(e.currentTarget.duration)}
        onTimeUpdate={(e) => {
          const now = e.currentTarget.currentTime;
          if (!dragging.current) setTime(now);
          updateBuffered(e.currentTarget);
          // Save at most every 5 seconds.
          if (Math.abs(now - lastSaved.current) >= 5) {
            lastSaved.current = now;
            writePosition(id, now);
          }
        }}
        onProgress={(e) => updateBuffered(e.currentTarget)}
        onPlay={() => {
          setPlaying(true);
          setResumedAt(null);
        }}
        onPause={(e) => {
          setPlaying(false);
          writePosition(id, e.currentTarget.currentTime);
        }}
        onWaiting={() => setBuffering(true)}
        onSeeking={() => setBuffering(true)}
        onPlaying={() => setBuffering(false)}
        onCanPlay={() => setBuffering(false)}
        onSeeked={(e) => {
          setBuffering(false);
          updateBuffered(e.currentTarget);
        }}
        onError={() => {
          setStatus("error");
          setPlaying(false);
          setBuffering(false);
        }}
        onEnded={() => {
          setPlaying(false);
          writePosition(id, 0);
          onEnded();
        }}
      />

      <div className="relative grid items-center gap-6 p-5 sm:grid-cols-[auto_1fr] sm:gap-8 sm:p-8">
        {/* Cover with an equaliser that moves while the lesson plays. */}
        <div className="relative mx-auto">
          <BookCover
            book={book}
            hue={hue}
            size="md"
            className={cn(
              "shadow-2xl shadow-black/50 transition-transform duration-500",
              playing && "scale-[1.03]",
            )}
          />
          <div
            aria-hidden
            className="absolute -bottom-2.5 left-1/2 flex h-6 -translate-x-1/2 items-end gap-0.75 rounded-full border border-white/10 bg-black/60 px-2.5 py-1.5 backdrop-blur"
          >
            {[0, 0.35, 0.15, 0.5].map((delay, i) => (
              <span
                key={i}
                style={{ animationDelay: `${delay}s` }}
                className={cn(
                  "tint-solid h-full w-0.75 origin-bottom rounded-full transition-transform",
                  playing && !buffering ? "motion-safe:animate-eq" : "scale-y-30",
                )}
              />
            ))}
          </div>
        </div>

        <div className="min-w-0">
          {status === "error" ? (
            <ErrorPanel src={src} onRetry={retry} />
          ) : (
            <>
              {/* Status line */}
              <p
                aria-live="polite"
                className="flex min-h-5 items-center gap-2 text-xs text-white/70"
              >
                <span
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    busy ? "bg-white/50 motion-safe:animate-pulse" : playing ? "tint-solid" : "bg-white/30",
                  )}
                />
                <span className="truncate">{caption}</span>
                {resumedAt !== null && !busy && (
                  <button
                    type="button"
                    onClick={() => {
                      seekTo(0);
                      setResumedAt(null);
                    }}
                    className="tint-fg shrink-0 font-medium hover:underline"
                  >
                    {t("watch.startOver")}
                  </button>
                )}
              </p>

              {/* Seek bar */}
              <div className="group relative mt-4 h-5">
                <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10 transition-[height] group-hover:h-2">
                  {loading ? (
                    <div className="absolute inset-0 motion-safe:animate-shimmer bg-[linear-gradient(90deg,transparent,oklch(1_0_0/0.18),transparent)]" />
                  ) : (
                    <>
                      <div
                        className="absolute inset-y-0 start-0 bg-white/15 transition-[width] duration-500"
                        style={{ width: `${bufferedPct}%` }}
                      />
                      <div className="tint-solid absolute inset-y-0 start-0" style={{ width: `${pct}%` }} />
                    </>
                  )}
                </div>
                {!loading && (
                  <div
                    aria-hidden
                    className="pointer-events-none absolute top-1/2 size-3.5 -translate-y-1/2 rounded-full bg-white shadow-md ring-4 ring-white/0 transition-[scale,box-shadow] group-hover:scale-110 group-has-focus-visible:ring-white/25 ltr:-translate-x-1/2 rtl:translate-x-1/2"
                    style={{ insetInlineStart: `${pct}%` }}
                  />
                )}
                <input
                  type="range"
                  min={0}
                  max={duration || 0}
                  step={1}
                  value={Math.floor(shown)}
                  disabled={loading}
                  aria-label={t("watch.seek")}
                  aria-valuetext={`${clock(shown)} / ${clock(duration)}`}
                  onPointerDown={() => (dragging.current = true)}
                  onChange={(e) => {
                    const v = Number(e.currentTarget.value);
                    if (dragging.current) setScrub(v);
                    else seekTo(v);
                  }}
                  onPointerUp={(e) => {
                    dragging.current = false;
                    seekTo(Number(e.currentTarget.value));
                    setScrub(null);
                  }}
                  className="absolute inset-0 w-full cursor-pointer appearance-none opacity-0 disabled:cursor-wait"
                />
              </div>

              {/* Times */}
              <div className="mt-1.5 flex justify-between text-xs text-white/60 tabular-nums">
                {loading ? (
                  <>
                    <span className="h-3.5 w-10 rounded bg-white/10 motion-safe:animate-pulse" />
                    <span className="h-3.5 w-12 rounded bg-white/10 motion-safe:animate-pulse" />
                  </>
                ) : (
                  <>
                    <span dir="ltr">{clock(shown)}</span>
                    <span dir="ltr">−{clock(duration - shown)}</span>
                  </>
                )}
              </div>

              {/* Controls */}
              <div className="mt-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-4 sm:justify-between">
                <div className="flex items-center gap-3">
                  <SkipButton
                    seconds={BACK}
                    label={t("watch.back", { s: numberFormat.format(BACK) })}
                    Icon={RotateCcw}
                    disabled={loading}
                    onClick={() => skip(-BACK)}
                    format={numberFormat.format}
                  />
                  <button
                    type="button"
                    onClick={toggle}
                    disabled={loading}
                    aria-label={playing ? t("watch.pause") : t("watch.play")}
                    className="relative flex size-16 items-center justify-center rounded-full bg-[oklch(0.93_0.05_var(--hue))] text-[oklch(0.2_0.05_var(--hue))] shadow-lg shadow-black/40 transition-[scale,opacity] hover:scale-105 active:scale-95 disabled:opacity-60 disabled:hover:scale-100"
                  >
                    {playing ? (
                      <Pause className="size-7 fill-current" />
                    ) : (
                      <Play className="size-7 translate-x-0.5 fill-current" />
                    )}
                    {busy && <Spinner />}
                  </button>
                  <SkipButton
                    seconds={FORWARD}
                    label={t("watch.forward", { s: numberFormat.format(FORWARD) })}
                    Icon={RotateCw}
                    disabled={loading}
                    onClick={() => skip(FORWARD)}
                    format={numberFormat.format}
                  />
                </div>

                <div
                  role="group"
                  aria-label={t("watch.speed")}
                  className="flex items-center gap-0.5 rounded-full border border-white/10 bg-black/25 p-1 text-xs"
                >
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSpeed(s)}
                      aria-pressed={speed === s}
                      className={cn(
                        "rounded-full px-2.5 py-1 tabular-nums transition-colors",
                        speed === s ? "bg-white/15 text-white" : "text-white/55 hover:text-white",
                      )}
                    >
                      {numberFormat.format(s)}×
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SkipButton({
  seconds,
  label,
  Icon,
  disabled,
  onClick,
  format,
}: {
  seconds: number;
  label: string;
  Icon: typeof RotateCcw;
  disabled: boolean;
  onClick: () => void;
  format: (n: number) => string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="relative flex size-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent"
    >
      <Icon className="size-7 stroke-[1.5]" />
      <span aria-hidden className="absolute pt-px text-[9px] font-semibold tabular-nums">
        {format(seconds)}
      </span>
    </button>
  );
}

/** A tinted arc spinning around the play button while loading or buffering. */
function Spinner() {
  return (
    <svg aria-hidden viewBox="0 0 72 72" className="absolute -inset-1 size-[calc(100%+0.5rem)] animate-spin [animation-duration:1.1s]">
      <circle cx="36" cy="36" r="34" fill="none" strokeWidth="3" className="stroke-white/10" />
      <circle
        cx="36"
        cy="36"
        r="34"
        fill="none"
        strokeWidth="3"
        strokeLinecap="round"
        strokeDasharray="60 200"
        className="stroke-[oklch(0.82_0.11_var(--hue))]"
      />
    </svg>
  );
}

function ErrorPanel({ src, onRetry }: { src: string; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <div role="alert" className="flex flex-col items-center gap-3 py-2 text-center sm:items-start sm:text-start">
      <span className="flex size-11 items-center justify-center rounded-full bg-destructive/15 text-destructive">
        <AlertTriangle className="size-5" />
      </span>
      <div>
        <p className="font-medium text-white">{t("watch.errorTitle")}</p>
        <p className="mt-1 max-w-md text-sm text-white/60">{t("watch.errorHint")}</p>
      </div>
      <div className="mt-1 flex flex-wrap items-center justify-center gap-2">
        <button
          type="button"
          onClick={onRetry}
          className="rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition-opacity hover:opacity-90"
        >
          {t("watch.retry")}
        </button>
        <a
          href={src}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm text-white/70 transition-colors hover:bg-white/10 hover:text-white"
        >
          {t("watch.openFile")}
          <ExternalLink className="size-3.5" />
        </a>
      </div>
    </div>
  );
}
