import {
  days,
  getSubject,
  type DayId,
  type Entry,
  type Subject,
} from "~/data/curriculum";
import type { ProgressState } from "~/lib/progress";

const JS_DAY_TO_ID: DayId[] = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];

export function dayIdOf(date: Date): DayId {
  return JS_DAY_TO_ID[date.getDay()];
}

/** Index of the Saturday-starting week, used to alternate two-subject days. */
export function weekIndex(date: Date) {
  const utcDays = Math.floor(
    Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / 86_400_000,
  );
  // 1970-01-03 was a Saturday (epoch day 2).
  return Math.floor((utcDays - 2) / 7);
}

/** The subject studied on a given day, resolving weekly alternation. */
export function subjectFor(dayId: DayId, date: Date): Subject {
  const day = days.find((d) => d.id === dayId)!;
  const id = day.subjects[weekIndex(date) % day.subjects.length];
  return getSubject(id)!;
}

/** The other subject on an alternating day, if any. */
export function alternateFor(dayId: DayId, date: Date): Subject | undefined {
  const day = days.find((d) => d.id === dayId)!;
  if (day.subjects.length < 2) return undefined;
  const id = day.subjects[(weekIndex(date) + 1) % day.subjects.length];
  return getSubject(id);
}

/** The option of an entry the student picked (or the first one). */
export function chosenOption(entry: Entry, p: ProgressState) {
  return entry.options.find((b) => p.books[b.id]) ?? entry.options[0];
}

export function entryStatus(entry: Entry, p: ProgressState) {
  if (entry.options.some((b) => p.books[b.id] === "done")) return "done";
  if (entry.options.some((b) => p.books[b.id] === "reading")) return "reading";
  return "todo";
}

/** First unfinished book in curriculum order — what to study next. */
export function currentEntry(subject: Subject, p: ProgressState) {
  for (const group of subject.groups) {
    for (const entry of group.entries) {
      if (entryStatus(entry, p) !== "done") return { group, entry };
    }
  }
  return undefined;
}

export function subjectProgress(subject: Subject, p: ProgressState) {
  let done = 0;
  let total = 0;
  for (const g of subject.groups) {
    for (const e of g.entries) {
      total++;
      if (entryStatus(e, p) === "done") done++;
    }
  }
  return { done, total, pct: total ? Math.round((done / total) * 100) : 0 };
}

export function groupProgress(entries: Entry[], p: ProgressState) {
  const done = entries.filter((e) => entryStatus(e, p) === "done").length;
  return { done, total: entries.length };
}
