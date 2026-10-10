import { useSyncExternalStore } from "react";

// The reader's own order for each adhkar collection, kept in localStorage (unlike the counts, it
// doesn't reset each day). Stored as the original indices in display order. Like useProgress(),
// the server snapshot is empty so SSR and the first client render agree.

type State = Record<string, number[]>;

const KEY = "islamic-studies:adhkar-order:v1";
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
    // Storage blocked: the order lasts for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The saved order if it still fits the collection (same adhkar count), else the original one. */
function resolve(saved: number[] | undefined, size: number): number[] {
  const original = Array.from({ length: size }, (_, i) => i);
  if (!saved || saved.length !== size) return original;
  const seen = new Set(saved);
  return seen.size === size && saved.every((i) => Number.isInteger(i) && i >= 0 && i < size) ? saved : original;
}

/** Original indices of a collection's adhkar in the reader's display order. */
export function useAdhkarOrder(collectionId: string, size: number): number[] {
  const s = useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY);
  return resolve(s[collectionId], size);
}

export const adhkarOrder = {
  /** Moves the dhikr at display position `from` to position `to` (clamped to the list). */
  move(collectionId: string, size: number, from: number, to: number) {
    update((s) => {
      const order = [...resolve(s[collectionId], size)];
      const target = Math.max(0, Math.min(size - 1, to));
      if (from === target) return s;
      const [item] = order.splice(from, 1);
      order.splice(target, 0, item);
      return { ...s, [collectionId]: order };
    });
  },
  reset(collectionId: string) {
    update(({ [collectionId]: _, ...rest }) => rest);
  },
};
