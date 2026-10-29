import { useSyncExternalStore } from "react";

// The listener's bookmark in a book's text, kept in localStorage: one per book, so placing it again
// moves it. It's anchored to a line, as block index + a character on that line (the typed-out texts
// are fixed, and the line follows the character when the text reflows), with the PDF page for the
// PDF view and the line's words for its tooltip. The reader opens there. Like useBookNotes(), the
// server snapshot is empty.

export type Bookmark = {
  /** The block's index in the book's blocks. */
  b: number;
  /** A character on the bookmarked line, counted from the block's start (absent in older bookmarks: its first line). */
  o?: number;
  page: number;
  /** The words at the bookmark. */
  quote: string;
  created: number;
};

type State = Record<string, Bookmark>;

const KEY = "islamic-studies:book-bookmarks:v1";
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
    // Storage blocked: the bookmark lasts for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** A book's bookmark, if it has one. */
export function useBookmark(bookId: string): Bookmark | null {
  return useSyncExternalStore(subscribe, () => (load(), state[bookId] ?? null), () => null);
}

export const bookmarks = {
  get(bookId: string): Bookmark | null {
    load();
    return state[bookId] ?? null;
  },
  /** Places the book's bookmark, replacing the one it had. */
  set(bookId: string, mark: Omit<Bookmark, "created">) {
    update((s) => ({ ...s, [bookId]: { ...mark, created: Date.now() } }));
  },
  remove(bookId: string) {
    update((s) => {
      const { [bookId]: _, ...rest } = s;
      return rest;
    });
  },
};
