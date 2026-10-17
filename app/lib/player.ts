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
  /** Another copy of the same file, tried when `src` doesn't load (and its archive.org servers, if it's there). */
  fallback?: string;
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
  /** Square image (e.g. the reciter's portrait) for the mini player and the lock screen. */
  artwork?: string;
  /** Runs when the recording finishes, even if the listener has moved to another page. */
  onEnded?: () => void;
  /**
   * Set for one of a list of recitations (a reciter's surahs): the players step to the previous or
   * next one (each absent at its end) instead of seeking by seconds, and always play at normal speed.
   */
  sequence?: { prev?: () => void; next?: () => void };
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
  /** 0–1, kept while muted so unmuting restores it. */
  volume: number;
  muted: boolean;
  /** Where playback resumed from a saved position, until the listener plays on or it times out. */
  resumedAt: number | null;
  /** Recording whose full player is on screen, so the mini player can step aside. */
  onScreen: string | null;
  /** Automatic reload attempt under way after a failure (1…MAX_RETRIES), or 0. */
  reconnecting: number;
};

export const SPEEDS = [1, 1.25, 1.5, 2];
export const BACK = 15;
export const FORWARD = 30;
/** Automatic reloads after a failure before the listener is shown the error (and a Retry button). */
export const MAX_RETRIES = 10;
/** Waiting this long for data while playing counts as a failure (browsers often stall rather than fail). */
const STALL_MS = 20_000;

const POSITION_KEY = (id: string) => `islamic-studies:position:${id}`;
const SPEED_KEY = "islamic-studies:speed";
const VOLUME_KEY = "islamic-studies:volume";
const MUTED_KEY = "islamic-studies:muted";

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
  volume: 1,
  muted: false,
  resumedAt: null,
  onScreen: null,
  reconnecting: 0,
};

let state: PlayerState = EMPTY;
let audio: HTMLAudioElement | null = null;
let lastSaved = 0;
let restored = false;
let resumedTimer: ReturnType<typeof setTimeout> | undefined;
// Automatic reloads: how many in a row, the pending one, the stall watchdog, and whether to play
// once reloaded (not if the listener had paused).
let failures = 0;
let retryTimer: ReturnType<typeof setTimeout> | undefined;
let stallTimer: ReturnType<typeof setTimeout> | undefined;
let autoplay = true;
// The open page's recording, loading in a hidden element before the listener presses play, so it
// starts at once. Play swaps it in for the current element (see prepare).
let standby: { id: string; el: HTMLAudioElement } | null = null;
const listeners = new Set<() => void>();

function set(patch: Partial<PlayerState>) {
  state = { ...state, ...patch };
  listeners.forEach((l) => l());
}

let settingsLoaded = false;

function subscribe(l: () => void) {
  // Show the listener's saved speed and volume before anything has played.
  if (!settingsLoaded) {
    settingsLoaded = true;
    try {
      const saved = Number(localStorage.getItem(SPEED_KEY));
      if (SPEEDS.includes(saved)) state = { ...state, speed: saved };
      const volume = localStorage.getItem(VOLUME_KEY);
      if (volume !== null && Number(volume) >= 0 && Number(volume) <= 1) state = { ...state, volume: Number(volume) };
      state = { ...state, muted: localStorage.getItem(MUTED_KEY) === "1" };
    } catch {}
  }
  listeners.add(l);
  return () => listeners.delete(l);
}

function saveVolume() {
  try {
    localStorage.setItem(VOLUME_KEY, String(state.volume));
    localStorage.setItem(MUTED_KEY, state.muted ? "1" : "0");
  } catch {}
}

/**
 * Whether this browser lets pages set the volume. iOS doesn't (the hardware buttons are the only
 * control), so the slider is hidden there. False on the server.
 */
export function canSetVolume() {
  if (typeof Audio === "undefined") return false;
  const probe = new Audio();
  probe.volume = 0.5;
  return probe.volume === 0.5;
}

/** The listener's chosen speed, except recitations, which always play at normal speed. */
const rate = () => (state.track?.sequence ? 1 : state.speed);

/** Lock screen, headphones and media keys: seek by seconds, or step through a sequence. */
function setMediaActions(track: Track | null) {
  if (!("mediaSession" in navigator)) return;
  const seq = track?.sequence;
  const handlers: [MediaSessionAction, MediaSessionActionHandler | null][] = [
    ["seekbackward", seq ? null : (d) => player.skip(-(d.seekOffset ?? BACK))],
    ["seekforward", seq ? null : (d) => player.skip(d.seekOffset ?? FORWARD)],
    ["previoustrack", seq?.prev ?? null],
    ["nexttrack", seq?.next ?? null],
  ];
  for (const [action, handler] of handlers) {
    try {
      navigator.mediaSession.setActionHandler(action, handler);
    } catch {
      // Action not supported by this browser.
    }
  }
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

// archive.org fallback. A file's usual address (archive.org/download/<item>/<file>) redirects to one
// of archive.org's servers, and that routing sometimes fails while the item's own two storage servers
// still serve it fine. So when an archive.org file fails, the player looks up those servers (from
// archive.org's metadata, which lists the ones currently working) and tries each, and keeps using
// whichever worked for the item's other files (a reciter's next surah, the next lesson).

const ARCHIVE = /^https:\/\/archive\.org\/download\/([^/]+)\/(.+)$/;

/** The archive.org item and file path of `src`, if it's an archive.org download. */
function archiveFile(src: string) {
  const m = ARCHIVE.exec(src);
  return m ? { item: m[1], path: m[2] } : null;
}

/** Per item: its storage servers, as base URLs to put a file path after. Looked up once per tab. */
const servers = new Map<string, Promise<string[]>>();

function serversOf(item: string) {
  let found = servers.get(item);
  if (!found) {
    found = fetch(`https://archive.org/metadata/${item}`)
      .then((r) => r.json())
      .then((m: { d1?: string; d2?: string; dir?: string; workable_servers?: string[] }) => {
        const hosts = m.workable_servers?.length ? m.workable_servers : [m.d1, m.d2].filter((h): h is string => !!h);
        return m.dir ? hosts.map((h) => `https://${h}${m.dir}/`) : [];
      })
      .catch(() => {
        // Try again next time.
        servers.delete(item);
        return [];
      });
    servers.set(item, found);
  }
  return found;
}

/** Per item: the server that took over after its usual address failed. */
const preferred = new Map<string, string>();

/** The archive.org copy of a track, if any: its fallback, or else its own address. */
const archived = (track: Track) => archiveFile(track.fallback ?? track.src);

// A track's main host (e.g. MP3 Quran) failed and its fallback took over: later tracks from the same
// folder (the reciter's other surahs) start on their fallback for the rest of the visit.
const fellBack = new Set<string>();
const folderOf = (src: string) => src.slice(0, src.lastIndexOf("/") + 1);

/** Where to load `track` from first: its fallback if its host failed earlier, on the archive.org server that took over, if any. */
function sourceFor(track: Track) {
  const src = track.fallback && fellBack.has(folderOf(track.src)) ? track.fallback : track.src;
  const file = archiveFile(src);
  const base = file && preferred.get(file.item);
  return base ? base + file.path : src;
}

/** Playback started from `src`: remember whether the fallback, and which archive.org server, worked. */
function remember(src: string | null, track: Track | null) {
  if (!track || !src) return;
  if (track.fallback) {
    if (src === track.src) return void fellBack.delete(folderOf(track.src));
    fellBack.add(folderOf(track.src));
  }
  const file = archived(track);
  if (!file) return;
  if (src === (track.fallback ?? track.src)) preferred.delete(file.item);
  else if (src.endsWith(file.path)) preferred.set(file.item, src.slice(0, -file.path.length));
}

/** Every address of `track`, in the order to try them: its own, its fallback, then the archive.org item's servers. */
async function addressesOf(track: Track) {
  const file = archived(track);
  const bases = file ? await serversOf(file.item) : [];
  return [track.src, ...(track.fallback ? [track.fallback] : []), ...(file ? bases.map((b) => b + file.path) : [])];
}

// The current track's addresses to try in turn: where it was loaded from, then the rest of addressesOf.
let sources: string[] = [];
let sourceAt = 0;

function resetRetries() {
  failures = 0;
  clearTimeout(retryTimer);
  clearTimeout(stallTimer);
}

/**
 * Something went wrong loading or playing: reload quietly from the same spot, waiting a little longer
 * each time, and only after MAX_RETRIES failures in a row show the error (with its Retry button). A
 * track with a fallback, or on archive.org, moves on at once to its other addresses (see addressesOf),
 * then cycles through them all.
 */
function fail(el: HTMLAudioElement) {
  const track = state.track;
  if (!track || !el.getAttribute("src")) return;
  clearTimeout(stallTimer);
  clearTimeout(retryTimer);
  if (failures >= MAX_RETRIES) {
    set({ status: "error", playing: false, buffering: false, reconnecting: 0 });
    return;
  }
  failures++;
  // Pick up exactly where it stopped; play on unless the listener had paused.
  if (state.time > 0) writePosition(track.id, state.time);
  autoplay = state.status === "loading" || state.playing;
  set({ status: "loading", buffering: true, reconnecting: failures });
  const elsewhere = !!track.fallback || !!archived(track);
  // The first few failures switch to another address straight away; after that, back off.
  const delay = elsewhere && failures <= 3 ? 0 : Math.min(failures, 5) * 1000;
  retryTimer = setTimeout(async () => {
    if (state.track?.id !== track.id) return;
    if (elsewhere && sources.length === 1) {
      const all = await addressesOf(track);
      if (state.track?.id !== track.id) return;
      sources = [...new Set([...sources, ...all])];
    }
    sourceAt = (sourceAt + 1) % sources.length;
    restored = false;
    if (sources[sourceAt] !== el.getAttribute("src")) el.src = sources[sourceAt];
    el.load();
  }, delay);
}

/** The recording's length is known: start from its saved position and play (unless paused). */
function onMetadata(el: HTMLAudioElement) {
  set({ duration: el.duration, status: "ready" });
  el.playbackRate = rate();
  if (restored || !state.track) return;
  restored = true;
  // After an automatic reload: no "picked up where you left off" note.
  const quiet = state.reconnecting > 0;
  set({ reconnecting: 0 });
  const at = readPosition(state.track.id);
  const start = at && at < el.duration - 5 ? at : 0;
  // A prepared element may already sit at an older saved position (e.g. before "Start over").
  if (el.currentTime !== start) el.currentTime = start;
  if (start) {
    set({ time: start });
    if (!quiet) showResumed(start);
  }
  if (autoplay) void el.play().catch(() => {});
}

/** Stops an element and drops its download. */
function release(el: HTMLAudioElement) {
  el.pause();
  el.removeAttribute("src");
  el.load();
}

/** The audio element, created on first use (client only) and kept until a prepared one replaces it. */
function element() {
  if (audio) return audio;
  audio = createElement();

  // Lock screen, headphones and media keys (the per-track ones are in setMediaActions).
  if ("mediaSession" in navigator) {
    const handlers: [MediaSessionAction, MediaSessionActionHandler][] = [
      ["play", () => void audio?.play().catch(() => {})],
      ["pause", () => audio?.pause()],
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
  return audio;
}

function createElement() {
  const el = new Audio();
  el.preload = "metadata";
  el.volume = state.volume;
  el.muted = state.muted;

  // Only the player's current element drives the state; a standby one loads quietly.
  const on = <K extends keyof HTMLMediaElementEventMap>(type: K, fn: () => void) =>
    el.addEventListener(type, () => el === audio && fn());

  on("loadedmetadata", () => onMetadata(el));
  on("durationchange", () => Number.isFinite(el.duration) && set({ duration: el.duration }));
  on("timeupdate", () => {
    const now = el.currentTime;
    set({ time: now });
    updateBuffered(el);
    // Save at most every 5 seconds.
    if (state.track && Math.abs(now - lastSaved) >= 5) {
      lastSaved = now;
      writePosition(state.track.id, now);
    }
  });
  on("progress", () => updateBuffered(el));
  on("play", () => {
    set({ playing: true });
    if (state.resumedAt !== null) showResumed(null);
  });
  on("pause", () => {
    set({ playing: false });
    if (state.track) writePosition(state.track.id, el.currentTime);
  });
  on("waiting", () => {
    set({ buffering: true });
    // Stuck waiting for data while meant to be playing: treat it as a failure.
    clearTimeout(stallTimer);
    stallTimer = setTimeout(() => !el.paused && state.buffering && fail(el), STALL_MS);
  });
  on("seeking", () => set({ buffering: true }));
  on("playing", () => {
    set({ buffering: false });
    // Playing again: the next failure starts a fresh round of retries.
    resetRetries();
    remember(el.getAttribute("src"), state.track);
  });
  on("canplay", () => {
    set({ buffering: false });
    clearTimeout(stallTimer);
  });
  on("seeked", () => {
    set({ buffering: false });
    updateBuffered(el);
  });
  on("error", () => {
    // ABORTED: the source was changed or removed on purpose (a new recording, or Stop).
    if (el.error?.code === MediaError.MEDIA_ERR_ABORTED) return;
    fail(el);
  });
  on("ended", () => {
    set({ playing: false });
    const track = state.track;
    if (!track) return;
    writePosition(track.id, 0);
    track.onEnded?.();
  });

  return el;
}

export const player = {
  /** Plays `track`: resumes it if it's the current one, otherwise switches to it (from its saved position). */
  play(track: Track) {
    const current = element();
    if (state.track?.id === track.id) {
      // Same recording: keep its newest details (e.g. the language of its labels) and resume.
      set({ track });
      if (state.status === "error") player.retry();
      else void current.play().catch(() => {});
      return;
    }
    if (state.track && !current.paused) writePosition(state.track.id, current.currentTime);
    let el = current;
    const prepared = standby?.id === track.id && !standby.el.error ? standby.el : null;
    const failedBefore = standby?.id === track.id && !!standby.el.error;
    if (prepared) {
      // Already loading in the background: it takes over from the current element.
      standby = null;
      audio = el = prepared;
      release(current);
      el.volume = state.volume;
      el.muted = state.muted;
    } else {
      el.pause();
      // Its background load failed: load it afresh as the current element.
      if (standby?.id === track.id) player.unprepare(track.id);
    }
    restored = false;
    lastSaved = 0;
    resetRetries();
    autoplay = true;
    showResumed(null);
    set({ track, status: "loading", playing: false, buffering: false, time: 0, buffered: 0, duration: track.duration ?? 0, reconnecting: 0 });
    sources = [prepared?.getAttribute("src") ?? sourceFor(track)];
    sourceAt = 0;
    if (!prepared && failedBefore && (track.fallback || archived(track))) {
      // The address it loaded from just failed in the background: start from its others, that one last.
      const target = el;
      const failed = sources[0];
      void addressesOf(track).then((all) => {
        if (state.track?.id !== track.id || audio !== target) return;
        sources = [...new Set([...all.filter((s) => s !== failed), failed])];
        target.src = sources[0];
        target.load();
      });
    } else if (!prepared) {
      el.src = sources[0];
      el.load();
    } else if (el.readyState >= HTMLMediaElement.HAVE_METADATA) {
      // Its loadedmetadata has been and gone: start it now, inside the listener's tap (iOS needs that).
      onMetadata(el);
      updateBuffered(el);
    }
    if ("mediaSession" in navigator && typeof MediaMetadata !== "undefined") {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.book.title.ar,
        artist: track.artist,
        album: track.label,
        artwork: track.artwork
          ? [{ src: new URL(track.artwork, location.href).href, sizes: "400x400", type: "image/jpeg" }]
          : [],
      });
    }
    setMediaActions(track);
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
    set({ speed });
    if (audio) audio.playbackRate = rate();
    try {
      localStorage.setItem(SPEED_KEY, String(speed));
    } catch {}
  },
  /** Sets the volume (0–1); turning it up unmutes, sliding it to 0 mutes. */
  setVolume(volume: number) {
    const v = Math.min(1, Math.max(0, volume));
    set({ volume: v, muted: v === 0 });
    if (audio) {
      audio.volume = v;
      audio.muted = v === 0;
    }
    saveVolume();
  },
  toggleMute() {
    // Unmuting from a volume of 0 would stay silent, so bring it back up a little.
    set({ muted: !state.muted, volume: state.muted && state.volume === 0 ? 0.5 : state.volume });
    if (audio) {
      audio.volume = state.volume;
      audio.muted = state.muted;
    }
    saveVolume();
  },
  /** The listener's Retry (after the automatic attempts gave up): a fresh round of attempts. */
  retry() {
    if (!audio) return;
    resetRetries();
    autoplay = true;
    restored = false;
    set({ status: "loading", reconnecting: 0 });
    audio.load();
  },
  /** Dismisses the "picked up where you left off" note, e.g. after "Start over". */
  clearResumed() {
    showResumed(null);
  },
  /** Stops and closes the player (the mini player's ✕); the position is kept for next time. */
  stop() {
    resetRetries();
    if (audio) {
      if (state.track) writePosition(state.track.id, audio.currentTime);
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    }
    showResumed(null);
    set({ ...EMPTY, speed: state.speed, volume: state.volume, muted: state.muted, onScreen: state.onScreen });
    if ("mediaSession" in navigator) navigator.mediaSession.metadata = null;
    setMediaActions(null);
  },
  /** A page's full player for `id` is on screen. */
  enterScreen(id: string) {
    if (state.onScreen !== id) set({ onScreen: id });
  },
  /** That page's player went away (unless another page has already taken its place). */
  leaveScreen(id: string) {
    if (state.onScreen === id) set({ onScreen: null });
  },
  /**
   * Starts loading `track` out of sight (the page showing its player has opened), so pressing play
   * starts it at once. Nothing changes on screen until then.
   */
  prepare(track: Track) {
    if (state.track?.id === track.id || standby?.id === track.id) return;
    if (standby) release(standby.el);
    const el = createElement();
    // Buffer ahead, unless another recording is playing and needs the bandwidth.
    el.preload = state.playing ? "metadata" : "auto";
    // Sit at the saved position, so that's the part that gets buffered.
    el.addEventListener(
      "loadedmetadata",
      () => {
        const at = readPosition(track.id);
        if (el !== audio && at && at < el.duration - 5) el.currentTime = at;
      },
      { once: true },
    );
    // Failed in the background: look up the archive.org item's servers now, so play can switch quickly.
    el.addEventListener("error", () => {
      const file = archived(track);
      if (file && el.error?.code !== MediaError.MEDIA_ERR_ABORTED) void serversOf(file.item);
    });
    el.src = sourceFor(track);
    standby = { id: track.id, el };
  },
  /** That page closed before its recording was played: stop loading it. */
  unprepare(id: string) {
    if (standby?.id !== id) return;
    release(standby.el);
    standby = null;
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
