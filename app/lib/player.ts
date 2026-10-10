import { useSyncExternalStore } from "react";
import type { Book } from "~/data/curriculum";

// The app's one audio player. It lives outside the React tree, so a recording keeps playing while
// the listener moves between pages; it only changes when they press play on another recording.
// Pages show their own recording's full player (AudioLesson) and the app shell shows a mini player
// whenever the playing recording isn't on screen. Like useProgress(), the server snapshot is empty
// so SSR and the first client render agree.

export type Track = {
  /** Stable key, used to remember the playback position. */
  id: string;
  src: string;
  book: Book;
  hue: number;
  /** Scholar's or reciter's name, shown in the mini player and on the lock screen. */
  artist: string;
  /** e.g. "Lesson 3" or "Surah al-Fātiḥah". */
  label: string;
  /** The page with this recording's full player, linked from the mini player. */
  href: string;
  /** Known length in seconds, shown before the file has loaded. */
  duration?: number;
  /** Runs when the recording finishes, even if the listener has moved to another page. */
  onEnded?: () => void;
};

export type Status = "loading" | "ready" | "error";

export type PlayerState = {
  track: Track | null;
  status: Status;
  playing: boolean;
  buffering: boolean;
  time: number;
  duration: number;
  buffered: number;
  speed: number;
  /** Where playback resumed from a saved position, until the listener plays on or it times out. */
  resumedAt: number | null;
  /** Recording whose full player is on screen, so the mini player can step aside. */
  onScreen: string | null;
};

export const SPEEDS = [1, 1.25, 1.5, 2];
export const BACK = 15;
export const FORWARD = 30;

const POSITION_KEY = (id: string) => `islamic-studies:position:${id}`;
const SPEED_KEY = "islamic-studies:speed";

export function readPosition(id: string) {
  try {
    return Number(localStorage.getItem(POSITION_KEY(id))) || 0;
  } catch {
    return 0;
  }
}

export function writePosition(id: string, seconds: number) {
  try {
    if (seconds > 0) localStorage.setItem(POSITION_KEY(id), String(Math.floor(seconds)));
    else localStorage.removeItem(POSITION_KEY(id));
  } catch {
    // Storage blocked: the recording just restarts from the beginning next time.
  }
}

const EMPTY: PlayerState = {
  track: null,
  status: "loading",
  playing: false,
  buffering: false,
  time: 0,
  duration: 0,
  buffered: 0,
  speed: 1,
  resumedAt: null,
  onScreen: null,
};

let state: PlayerState = EMPTY;
let audio: HTMLAudioElement | null = null;
let lastSaved = 0;
let restored = false;
let resumedTimer: ReturnType<typeof setTimeout> | undefined;
const listeners = new Set<() => void>();

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let speedLoaded = false;

function subscribe(l: () => void) {
  // Show the listener's saved speed before anything has played.
  if (!speedLoaded) {
    speedLoaded = true;
    try {
      const saved = Number(localStorage.getItem(SPEED_KEY));
      if (SPEEDS.includes(saved)) state = { ...state, speed: saved };
    } catch {}
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

function updateBuffered(el: HTMLAudioElement) {
  const ranges = el.buffered;
  for (let i = 0; i < ranges.length; i++) {
    if (ranges.start(i) <= el.currentTime && el.currentTime <= ranges.end(i)) {
      if (ranges.end(i) !== state.buffered) set({ buffered: ranges.end(i) });
      return;
    }
  }
}

function showResumed(at: number | null) {
  clearTimeout(resumedTimer);
  set({ resumedAt: at });
  // Hide the "picked up where you left off" note after a while.
  if (at !== null) resumedTimer = setTimeout(() => set({ resumedAt: null }), 8000);
}

/** The audio element, created on first use (client only) and kept for the life of the tab. */
function element() {
  if (audio) return audio;
  const el = new Audio();
  el.preload = "metadata";

  el.addEventListener("loadedmetadata", () => {
    set({ duration: el.duration, status: "ready" });
    el.playbackRate = state.speed;
    if (restored || !state.track) return;
    restored = true;
    const at = readPosition(state.track.id);
    if (at && at < el.duration - 5) {
      el.currentTime = at;
      set({ time: at });
      showResumed(at);
    }
    void el.play().catch(() => {});
  });
  el.addEventListener("durationchange", () => Number.isFinite(el.duration) && set({ duration: el.duration }));
  el.addEventListener("timeupdate", () => {
    const now = el.currentTime;
    set({ time: now });
    updateBuffered(el);
    // Save at most every 5 seconds.
    if (state.track && Math.abs(now - lastSaved) >= 5) {
      lastSaved = now;
      writePosition(state.track.id, now);
    }
  });
  el.addEventListener("progress", () => updateBuffered(el));
  el.addEventListener("play", () => {
    set({ playing: true });
    if (state.resumedAt !== null) showResumed(null);
  });
  el.addEventListener("pause", () => {
    set({ playing: false });
    if (state.track) writePosition(state.track.id, el.currentTime);
  });
  el.addEventListener("waiting", () => set({ buffering: true }));
  el.addEventListener("seeking", () => set({ buffering: true }));
  el.addEventListener("playing", () => set({ buffering: false }));
  el.addEventListener("canplay", () => set({ buffering: false }));
  el.addEventListener("seeked", () => {
    set({ buffering: false });
    updateBuffered(el);
  });
  el.addEventListener("error", () => {
    if (!el.getAttribute("src")) return;
    set({ status: "error", playing: false, buffering: false });
  });
  el.addEventListener("ended", () => {
    set({ playing: false });
    const track = state.track;
    if (!track) return;
    writePosition(track.id, 0);
    track.onEnded?.();
  });

  // Lock screen, headphones and media keys.
  if ("mediaSession" in navigator) {
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void el.play().catch(() => {})],
      ["pause", () => el.pause()],
      ["seekbackward", (d) => player.skip(-(d.seekOffset ?? BACK))],
      ["seekforward", (d) => player.skip(d.seekOffset ?? FORWARD)],
      ["seekto", (d) => d.seekTime !== undefined && player.seek(d.seekTime)],
    ];
    for (const [action, handler] of handlers) {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch {
        // Action not supported by this browser.
      }
    }
  }

  audio = el;
  return el;
}

export const player = {
  /** Plays `track`: resumes it if it's the current one, otherwise switches to it (from its saved position). */
  play(track: Track) {
    const el = element();
    if (state.track?.id === track.id) {
      // Same recording: keep its newest details (e.g. the language of its labels) and resume.
      set({ track });
      if (state.status === "error") player.retry();
      else void el.play().catch(() => {});
      return;
    }
    if (state.track && !el.paused) writePosition(state.track.id, el.currentTime);
    el.pause();
    restored = false;
    lastSaved = 0;
    showResumed(null);
    set({ track, status: "loading", playing: false, buffering: false, time: 0, buffered: 0, duration: track.duration ?? 0 });
    el.src = track.src;
    el.load();
    if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({ title: track.book.title.ar, artist: track.artist, album: track.label });
    }
  },
  toggle() {
    if (!audio || !state.track || state.status !== "ready") return;
    if (audio.paused) void audio.play().catch(() => {});
    else audio.pause();
  },
  seek(seconds: number) {
    if (!audio || !state.duration) return;
    audio.currentTime = Math.min(Math.max(0, seconds), state.duration - 0.5);
    set({ time: audio.currentTime });
  },
  skip(delta: number) {
    if (audio) player.seek(audio.currentTime + delta);
  },
  setSpeed(speed: number) {
    if (audio) audio.playbackRate = speed;
    set({ speed });
    try {
      localStorage.setItem(SPEED_KEY, String(speed));
    } catch {}
  },
  retry() {
    if (!audio) return;
    restored = false;
    set({ status: "loading" });
    audio.load();
  },
  /** Dismisses the "picked up where you left off" note, e.g. after "Start over". */
  clearResumed() {
    showResumed(null);
  },
  /** Stops and closes the player (the mini player's ✕); the position is kept for next time. */
  stop() {
    if (audio) {
      if (state.track) writePosition(state.track.id, audio.currentTime);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    showResumed(null);
    set({ ...EMPTY, speed: state.speed, onScreen: state.onScreen });
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
  },
  /** A page's full player for `id` is on screen. */
  enterScreen(id: string) {
    if (state.onScreen !== id) set({ onScreen: id });
  },
  /** That page's player went away (unless another page has already taken its place). */
  leaveScreen(id: string) {
    if (state.onScreen === id) set({ onScreen: null });
  },
};

export function usePlayer(): PlayerState {
  return useSyncExternalStore(subscribe, () => state, () => EMPTY);
}

/** Whether the mini player is showing: something is loaded and its full player isn't on this page. */
export function useMiniPlayerVisible() {
  const s = usePlayer();
  return !!s.track && s.onScreen !== s.track.id;
}
