import { useSyncExternalStore } from "react";

// The listener's notes on passages of a book's text, kept in localStorage. Each note is anchored by
// block index and character offset within the rendered block (the typed-out texts are fixed), with
// the passage itself kept for the notes list. Like useProgress(), the server snapshot is empty.

/** A point in the text: the block's index in the book's blocks and the character offset inside it. */
export type TextPoint = { b: number; o: number };

export type BookNote = {
  id: string;
  start: TextPoint;
  end: TextPoint;
  /** The highlighted passage, for the list (and in case the text ever changes). */
  quote: string;
  /** The PDF page the passage starts on. */
  page: number;
  /** May be empty: a plain highlight. */
  text: string;
  created: number;
  updated: number;
};

type State = Record<string, BookNote[]>;

const KEY = "islamic-studies:book-notes:v1";
const EMPTY: State = {};
const NONE: BookNote[] = [];

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
    // Storage blocked: notes last for this tab only.
  }
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => listeners.delete(l);
}

/** Negative when `a` comes before `b` in the text. */
export const comparePoints = (a: TextPoint, b: TextPoint) => a.b - b.b || a.o - b.o;

/** In reading order: by where each passage starts. */
const byPosition = (a: BookNote, b: BookNote) => comparePoints(a.start, b.start);

type Span = { start: TextPoint; end: TextPoint };

/** The note whose passage shares any text with `span` (passages that only touch don't count). */
export function overlapping(notes: BookNote[], span: Span): BookNote | undefined {
  return notes.find((n) => comparePoints(span.start, n.end) < 0 && comparePoints(n.start, span.end) < 0);
}

/** A book's notes, in reading order. */
export function useBookNotes(bookId: string): BookNote[] {
  return useSyncExternalStore(subscribe, () => (load(), state[bookId] ?? NONE), () => NONE);
}

export const bookNotes = {
  /** Adds a note, unless its passage overlaps another note's (then nothing changes and null is returned). */
  add(bookId: string, note: Omit<BookNote, "id" | "created" | "updated">): BookNote | null {
    load();
    if (comparePoints(note.start, note.end) >= 0 || overlapping(state[bookId] ?? [], note)) return null;
    const now = Date.now();
    const full: BookNote = { ...note, id: `${now.toString(36)}${Math.random().toString(36).slice(2, 6)}`, created: now, updated: now };
    update((s) => ({ ...s, [bookId]: [...(s[bookId] ?? []), full].sort(byPosition) }));
    return full;
  },
  setText(bookId: string, id: string, text: string) {
    update((s) => ({
      ...s,
      [bookId]: (s[bookId] ?? []).map((n) => (n.id === id ? { ...n, text, updated: Date.now() } : n)),
    }));
  },
  remove(bookId: string, id: string) {
    update((s) => {
      const next = (s[bookId] ?? []).filter((n) => n.id !== id);
      const { [bookId]: _, ...rest } = s;
      return next.length ? { ...rest, [bookId]: next } : rest;
    });
  },
};
