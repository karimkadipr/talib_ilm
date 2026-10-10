import { useSyncExternalStore } from "react";
import { localDateKey } from "~/lib/progress";

// How many repetitions are left of each dhikr today, kept in localStorage and reset each new day.
// Like useProgress(), the server snapshot is empty so SSR and the first client render agree.

type State = { date: string; done: Record<string, number[]> };

const KEY = "islamic-studies:adhkar:v1";
const EMPTY: State = { date: "", done: {} };

let state: State = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function today(s: State): State {
  const date = localDateKey();
  return s.date === date ? s : { date, done: {} };
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    state = today(raw ? { ...EMPTY, ...JSON.parse(raw) } : EMPTY);
  } catch {
    state = today(EMPTY);
  }
}

function update(fn: (s: State) => State) {
  load();
  state = fn(today(state));
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: counts last for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Repetitions already said today for each dhikr of a collection (0 for each before hydration). */
export function useAdhkarDone(collectionId: string, size: number): number[] {
  const s = useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY);
  const done = s.date === localDateKey() ? s.done[collectionId] : undefined;
  return Array.from({ length: size }, (_, i) => done?.[i] ?? 0);
}

export const adhkarProgress = {
  /** One more repetition of dhikr `i`, capped at its count. Returns the new tally. */
  tap(collectionId: string, i: number, count: number, size: number) {
    let next = 0;
    update((s) => {
      const arr = Array.from({ length: size }, (_, k) => s.done[collectionId]?.[k] ?? 0);
      arr[i] = next = Math.min(count, arr[i] + 1);
      return { ...s, done: { ...s.done, [collectionId]: arr } };
    });
    return next;
  },
  reset(collectionId: string, i?: number) {
    update((s) => {
      if (i === undefined) {
        const { [collectionId]: _, ...rest } = s.done;
        return { ...s, done: rest };
      }
      const arr = [...(s.done[collectionId] ?? [])];
      arr[i] = 0;
      return { ...s, done: { ...s.done, [collectionId]: arr } };
    });
  },
};
