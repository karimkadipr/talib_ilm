import { useSyncExternalStore } from "react";

// The listener's favourite surahs, per reciter, kept in localStorage. Like useProgress(), the
// server snapshot is empty so SSR and the first client render agree.

type State = Record<string, number[]>;

const KEY = "islamic-studies:quran-favorites:v1";
const EMPTY: State = {};

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

function update(fn: (s: State) => State) {
  load();
  state = fn(state);
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: favourites last for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Favourite surah numbers by reciter id, each list in mushaf order. */
export function useQuranFavorites(): State {
  return useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY);
}

export const quranFavorites = {
  toggle(reciterId: string, surah: number) {
    update((s) => {
      const list = s[reciterId] ?? [];
      const next = list.includes(surah) ? list.filter((n) => n !== surah) : [...list, surah].sort((a, b) => a - b);
      const { [reciterId]: _, ...rest } = s;
      return next.length ? { ...rest, [reciterId]: next } : rest;
    });
  },
  /** Current favourites of a reciter (read when a recording ends, so it reflects later changes). */
  of(reciterId: string): number[] {
    load();
    return state[reciterId] ?? [];
  },
};
