import { useSyncExternalStore } from "react";

// What the reader has memorized of the Qur'an, per riwayah (its ayat are numbered in that riwayah):
// when each ayah was memorized and last revised, the ayat flagged as weak, and the weak transitions
// (stalling on the way from an ayah into the next), plus a log of what was memorized and revised
// when. Kept in localStorage (so the settings' backup includes it). Like useProgress(), the server
// snapshot is empty so SSR and the first client render agree.

export type AyahRecord = {
  /** When it was memorized (ms since the epoch). */
  m?: number;
  /** When it was last revised; memorizing it counts as a revision. */
  r?: number;
  /** Flagged as weak: it needs more work. */
  w?: 1;
  /** The way from it into the next ayah is weak. */
  t?: 1;
};

export type HifzRange = { surah: number; from: number; to: number };

export type HifzLogEntry = HifzRange & {
  at: number;
  kind: "memorized" | "revised";
  /** A whole juz logged at once (its first surah's part is in surah/from/to). */
  juz?: number;
};

export type Riwayah = {
  /** By "surah:ayah". */
  ayahs: Record<string, AyahRecord>;
  /** Newest first. */
  log: HifzLogEntry[];
};

type State = Record<string, Riwayah>;

const KEY = "islamic-studies:hifz:v1";
const EMPTY: State = {};
const NONE: Riwayah = { ayahs: {}, log: [] };
/** How much history is kept. */
const LOG_SIZE = 300;

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = raw ? JSON.parse(raw) : EMPTY;
  } catch {
    state = EMPTY;
  }
}

function update(mushafId: string, fn: (r: Riwayah) => Riwayah) {
  load();
  state = { ...state, [mushafId]: fn(state[mushafId] ?? NONE) };
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: it lasts for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

export const ayahKey = (surah: number, n: number) => `${surah}:${n}`;

/** The reader's memorization in a riwayah. */
export function useHifz(mushafId: string): Riwayah {
  return useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY)[mushafId] ?? NONE;
}

/** Changes one ayah's record, dropping it once nothing is left in it. */
function edit(r: Riwayah, surah: number, n: number, fn: (a: AyahRecord) => AyahRecord): Riwayah {
  const key = ayahKey(surah, n);
  const next = fn(r.ayahs[key] ?? {});
  const ayahs = { ...r.ayahs };
  if (Object.values(next).some((v) => v !== undefined)) ayahs[key] = next;
  else delete ayahs[key];
  return { ...r, ayahs };
}

/**
 * Marks ranges memorized or revised at `at`, with one log entry for them all. Either way the ayat count
 * as memorized from then (a revised ayah is one already known) and as revised then, unless a later
 * revision is already recorded.
 */
function logRanges(r: Riwayah, kind: HifzLogEntry["kind"], ranges: HifzRange[], at: number, juz?: number): Riwayah {
  for (const { surah, from, to } of ranges)
    for (let n = from; n <= to; n++)
      r = edit(r, surah, n, (a) => ({ ...a, m: a.m === undefined ? at : Math.min(a.m, at), r: Math.max(a.r ?? 0, at) }));
  // One entry: the span of a surah's parts, or a juz by its first surah's part.
  const [first, last] = [ranges[0], ranges.at(-1)!];
  const entry: HifzLogEntry = { at, kind, ...first, ...(last.surah === first.surah ? { to: last.to } : {}), ...(juz ? { juz } : {}) };
  // Newest first, a past date slotting in where it belongs.
  const log = [...r.log, entry].sort((a, b) => b.at - a.at).slice(0, LOG_SIZE);
  return { ...r, log };
}

export const hifz = {
  /** Logs ayat `from`–`to` of a surah as memorized or revised at `at` (now by default). */
  log(mushafId: string, kind: HifzLogEntry["kind"], surah: number, from: number, to: number, at = Date.now()) {
    update(mushafId, (r) => logRanges(r, kind, [{ surah, from, to }], at));
  },
  /** Logs several ranges as one entry: a surah's memorized parts, or a whole juz (its part of each surah). */
  logMany(mushafId: string, kind: HifzLogEntry["kind"], ranges: HifzRange[], at = Date.now(), juz?: number) {
    if (ranges.length) update(mushafId, (r) => logRanges(r, kind, ranges, at, juz));
  },
  /** Puts a riwayah back as it was, to undo what was just logged. */
  restore(mushafId: string, riwayah: Riwayah) {
    update(mushafId, () => riwayah);
  },
  /** No longer memorized (its flags stay, they're still worth knowing). */
  forget(mushafId: string, surah: number, from: number, to: number) {
    update(mushafId, (r) => {
      for (let n = from; n <= to; n++) r = edit(r, surah, n, ({ m: _m, r: _r, ...rest }) => rest);
      return r;
    });
  },
  setWeak(mushafId: string, surah: number, n: number, weak: boolean) {
    update(mushafId, (r) => edit(r, surah, n, (a) => ({ ...a, w: weak ? 1 : undefined })));
  },
  setWeakTransition(mushafId: string, surah: number, n: number, weak: boolean) {
    update(mushafId, (r) => edit(r, surah, n, (a) => ({ ...a, t: weak ? 1 : undefined })));
  },
  /** Drops one entry of the log (what it recorded stays). */
  removeLogEntry(mushafId: string, entry: HifzLogEntry) {
    update(mushafId, (r) => ({ ...r, log: r.log.filter((e) => e !== entry) }));
  },
};

export type SurahHifz = {
  memorized: number;
  weak: number;
  transitions: number;
  /** The most recent revision of any of its ayat, and the oldest "last revision" among its memorized ones. */
  lastRevised?: number;
  oldestRevised?: number;
};

/** A surah's memorization at a glance. */
export function surahHifz(r: Riwayah, surah: number, ayahs: number): SurahHifz {
  const s: SurahHifz = { memorized: 0, weak: 0, transitions: 0 };
  for (let n = 1; n <= ayahs; n++) {
    const a = r.ayahs[ayahKey(surah, n)];
    if (!a) continue;
    if (a.w) s.weak++;
    if (a.t) s.transitions++;
    if (a.m === undefined) continue;
    s.memorized++;
    if (a.r !== undefined) {
      s.lastRevised = Math.max(s.lastRevised ?? 0, a.r);
      s.oldestRevised = Math.min(s.oldestRevised ?? Infinity, a.r);
    }
  }
  return s;
}

/** The reader's memorization in a riwayah over the whole Qur'an. */
export function hifzTotals(r: Riwayah) {
  let memorized = 0;
  let weak = 0;
  let transitions = 0;
  for (const a of Object.values(r.ayahs)) {
    if (a.m !== undefined) memorized++;
    if (a.w) weak++;
    if (a.t) transitions++;
  }
  return { memorized, weak, transitions };
}

export const DAY = 86_400_000;
export const startOfDay = (ms: number) => new Date(ms).setHours(0, 0, 0, 0);
/** A revision older than this is shown as due. */
export const DUE_DAYS = 7;

/** The memorized ayat of a surah as runs of consecutive ones, to log them as ranges. */
export function memorizedRuns(r: Riwayah, surah: number, ayahs: number) {
  const runs: [number, number][] = [];
  for (let n = 1; n <= ayahs; n++) {
    if (r.ayahs[ayahKey(surah, n)]?.m === undefined) continue;
    const last = runs.at(-1);
    if (last && last[1] === n - 1) last[1] = n;
    else runs.push([n, n]);
  }
  return runs;
}
