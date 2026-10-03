import { cn } from "cn";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { BookCover } from "~/components/book-cover";
import type { Book } from "~/data/curriculum";

const SPEEDS = [1, 1.25, 1.5, 2];
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

/**
 * Audio lesson player. Remembers where you stopped in each lesson (they run
 * 1–1½ hours) and reports when the recording finishes.
 */
export function AudioLesson({
  id,
  src,
  book,
  hue,
  onEnded,
}: {
  /** Stable lesson key, used to remember the playback position. */
  id: string;
  src: string;
  book: Book;
  hue: number;
  onEnded: () => void;
}) {
  const { t, i18n } = useTranslation();
  const audio = useRef<HTMLAudioElement>(null);
  const lastSaved = useRef(0);
  const [speed, setSpeed] = useState(1);

  // Restore the saved position once the browser knows the duration.
  useEffect(() => {
    const el = audio.current;
    if (!el) return;
    const restore = () => {
      const at = readPosition(id);
      if (at && at < el.duration - 5) el.currentTime = at;
    };
    if (el.readyState >= 1) restore();
    else el.addEventListener("loadedmetadata", restore, { once: true });
    return () => el.removeEventListener("loadedmetadata", restore);
  }, [id]);

  useEffect(() => {
    if (audio.current) audio.current.playbackRate = speed;
  }, [speed]);

  const numberFormat = new Intl.NumberFormat(i18n.language);

  return (
    <div
      style={{ "--hue": hue } as React.CSSProperties}
      className="relative overflow-hidden rounded-2xl border bg-[radial-gradient(80%_120%_at_50%_0%,oklch(0.28_0.06_var(--hue)),oklch(0.14_0.01_var(--hue)))]"
    >
      <div className="bg-khatam absolute inset-0 opacity-60" />
      <div className="relative flex flex-col items-center gap-6 px-4 pt-8 pb-5 sm:px-8">
        <BookCover book={book} hue={hue} size="md" className="shadow-2xl shadow-black/50" />
        <audio
          ref={audio}
          src={src}
          controls
          preload="metadata"
          className="w-full"
          onTimeUpdate={(e) => {
            // Save at most every 5 seconds.
            const now = e.currentTarget.currentTime;
            if (Math.abs(now - lastSaved.current) >= 5) {
              lastSaved.current = now;
              writePosition(id, now);
            }
          }}
          onPause={(e) => writePosition(id, e.currentTarget.currentTime)}
          onEnded={() => {
            writePosition(id, 0);
            onEnded();
          }}
        />
        <div className="flex items-center gap-1 self-end text-xs">
          <span className="me-1 text-white/60">{t("watch.speed")}</span>
          {SPEEDS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSpeed(s)}
              aria-pressed={speed === s}
              className={cn(
                "rounded-full px-2.5 py-1 tabular-nums transition-colors",
                speed === s ? "bg-white/15 text-white" : "text-white/60 hover:text-white",
              )}
            >
              {numberFormat.format(s)}×
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
