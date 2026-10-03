import { useSyncExternalStore } from "react";

// The student's progress, kept in localStorage until there are accounts.
// Read through useProgress(); the server snapshot is always EMPTY so SSR and
// the first client render agree, then the stored state swaps in.

export type BookStatus = "reading" | "done";

export type ProgressState = {
  books: Record<string, BookStatus>;
  /** Keys are `${seriesId}#${lessonNumber}`. */
  watched: Record<string, true>;
  last?: { seriesId: string; lesson: number; at: number };
  /** Daily programme ticks, keyed by local ISO date. */
  daily: Record<string, string[]>;
  notes: Record<string, string>;
};

const KEY = "islamic-studies:progress:v1";
const EMPTY: ProgressState = { books: {}, watched: {}, daily: {}, notes: {} };

let state: ProgressState = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) state = { ...EMPTY, ...JSON.parse(raw) };
  } catch {
    // Private mode or corrupted JSON: start fresh.
  }
}

function save() {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage full or blocked; progress stays in memory for this tab.
  }
}

function update(fn: (s: ProgressState) => ProgressState) {
  load();
  state = fn(state);
  save();
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function useProgress() {
  return useSyncExternalStore(
    subscribe,
    () => (load(), state),
    () => EMPTY,
  );
}

export const lessonKey = (seriesId: string, n: number) => `${seriesId}#${n}`;

export function localDateKey(d = new Date()) {
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export const progress = {
  setBook(bookId: string, status: BookStatus | null) {
    update((s) => {
      const books = { ...s.books };
      if (status) books[bookId] = status;
      else delete books[bookId];
      return { ...s, books };
    });
  },

  toggleWatched(seriesId: string, bookId: string, n: number, watched?: boolean) {
    update((s) => {
      const key = lessonKey(seriesId, n);
      const next = watched ?? !s.watched[key];
      const w = { ...s.watched };
      if (next) w[key] = true;
      else delete w[key];
      // Watching a lesson means you're reading the book.
      const books = s.books[bookId] ? s.books : { ...s.books, [bookId]: "reading" as const };
      return { ...s, watched: w, books };
    });
  },

  open(seriesId: string, bookId: string, lesson: number) {
    update((s) => ({
      ...s,
      last: { seriesId, lesson, at: Date.now() },
      books: s.books[bookId] ? s.books : { ...s.books, [bookId]: "reading" },
    }));
  },

  toggleDaily(taskId: string, date = localDateKey()) {
    update((s) => {
      const done = new Set(s.daily[date] ?? []);
      if (done.has(taskId)) done.delete(taskId);
      else done.add(taskId);
      return { ...s, daily: { ...s.daily, [date]: [...done] } };
    });
  },

  setNote(key: string, text: string) {
    update((s) => ({ ...s, notes: { ...s.notes, [key]: text } }));
  },
};

/** Consecutive days, ending today (or yesterday), with any daily task done. */
export function streak(s: ProgressState, today = new Date()) {
  const d = new Date(today);
  if (!s.daily[localDateKey(d)]?.length) d.setDate(d.getDate() - 1);
  let n = 0;
  while (s.daily[localDateKey(d)]?.length) {
    n++;
    d.setDate(d.getDate() - 1);
  }
  return n;
}

export function watchedCount(s: ProgressState, seriesId: string, total: number) {
  let n = 0;
  for (let i = 1; i <= total; i++) if (s.watched[lessonKey(seriesId, i)]) n++;
  return n;
}
