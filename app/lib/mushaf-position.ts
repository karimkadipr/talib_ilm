import { useSyncExternalStore } from "react";

// The last mushaf page the reader opened in each riwayah, kept in localStorage so the riwayah's page
// can offer to continue from it. Like useProgress(), the server snapshot is empty so SSR and the first
// client render agree.

type State = Partial<Record<string, number>>;

const KEY = "islamic-studies:mushaf-page:v1";
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

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** The page last opened in this riwayah, if any. */
export function useMushafPage(mushafId: string): number | undefined {
  return useSyncExternalStore(subscribe, () => (load(), state), () => EMPTY)[mushafId];
}

export const mushafPosition = {
  set(mushafId: string, page: number) {
    load();
    if (state[mushafId] === page) return;
    state = { ...state, [mushafId]: page };
    try {
      window.localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage blocked: the position lasts for this tab only.
    }
    listeners.forEach((l) => l());
  },
};
