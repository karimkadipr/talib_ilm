import { cn } from "cn";
import { ArrowRight, Check, Flame, Play, Repeat } from "lucide-react";
import { href, Link } from "react-router";
import { BookCover } from "~/components/book-cover";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { dailyProgramme, days, getBook } from "~/data/curriculum";
import { getScholar, getSeries, seriesForBook } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { localDateKey, progress, streak, useProgress, watchedCount } from "~/lib/progress";
import {
  alternateFor,
  chosenOption,
  currentEntry,
  dayIdOf,
  subjectFor,
  subjectProgress,
} from "~/lib/schedule";
import { getInstance } from "~/middleware/i18next";
import type { Route } from "./+types/route";

export async function loader({ context }: Route.LoaderArgs) {
  // Server time seeds "today" so the first render matches on both sides.
  return { now: Date.now(), title: getInstance(context).t("nav.today") };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

function TodayHero({ date }: { date: Date }) {
  const p = useProgress();
  const { l, t, num } = useLocalize();
  const dayId = dayIdOf(date);
  const day = days.find((d) => d.id === dayId)!;
  const subject = subjectFor(dayId, date);
  const alternate = alternateFor(dayId, date);
  const current = currentEntry(subject, p);
  const book = current && chosenOption(current.entry, p);
  const explanations = book ? seriesForBook(book.id) : [];
  const sp = subjectProgress(subject, p);

  // Resume the series the student was watching for this book, if any.
  const lastSeries = p.last && getSeries(p.last.seriesId);
  const resume = lastSeries && book && lastSeries.bookId === book.id ? p.last : undefined;

  return (
    <section
      style={{ "--hue": subject.hue } as React.CSSProperties}
      className="relative overflow-hidden rounded-3xl border tint-border bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.55),transparent_60%)] bg-card"
    >
      <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-center sm:p-8">
        {book && (
          <Link to={href("/books/:bookId", { bookId: book.id })} className="self-start sm:self-auto">
            <BookCover book={book} hue={subject.hue} size="lg" className="shadow-2xl shadow-black/40" />
          </Link>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="tint-bg tint-fg rounded-full px-2.5 py-1 font-medium">
              {t("today.studyOf", { day: l(day.name) })}
            </span>
            {alternate && (
              <span className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-muted-foreground">
                <Repeat className="size-3" />
                {t("today.alternates", { other: l(alternate.name) })}
              </span>
            )}
          </div>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight sm:text-3xl">{l(subject.name)}</h1>

          {book && current ? (
            <>
              <p className="mt-4 text-sm text-muted-foreground">
                {t("level.n", { n: num(current.group.level ?? 1) })} · {t("today.nextBook")}
              </p>
              <p lang="ar" className="font-arabic mt-1 text-2xl leading-relaxed text-foreground sm:text-3xl">
                {book.title.ar}
              </p>
              <p className="text-sm text-muted-foreground">
                {l(book.title) !== book.title.ar && <>{book.title.en} · </>}
                {l(book.author)}
              </p>
            </>
          ) : (
            <p className="mt-4 text-muted-foreground">{t("today.subjectDone")}</p>
          )}

          <div className="mt-6 flex flex-wrap items-center gap-3">
            {resume ? (
              <Button asChild size="lg" className="rounded-full">
                <Link to={href("/watch/:seriesId/:lesson", { seriesId: resume.seriesId, lesson: String(resume.lesson) })}>
                  <Play className="fill-current" />
                  {t("today.resumeLesson", { n: num(resume.lesson) })}
                </Link>
              </Button>
            ) : book ? (
              <Button asChild size="lg" className="rounded-full">
                <Link to={href("/books/:bookId", { bookId: book.id })}>
                  <Play className="fill-current" />
                  {explanations.length
                    ? t("today.chooseExplanation", { count: explanations.length })
                    : t("today.openBook")}
                </Link>
              </Button>
            ) : null}
            <Button asChild variant="ghost" className="rounded-full">
              <Link to={href("/subjects/:subjectId", { subjectId: subject.id })}>
                {t("today.viewCurriculum")}
                <ArrowRight className="rtl:rotate-180" />
              </Link>
            </Button>
          </div>

          <div className="mt-6 flex items-center gap-3 text-xs text-muted-foreground">
            <Progress value={sp.pct} className="h-1.5 max-w-48 bg-white/8" />
            <span className="tabular-nums">
              {t("progress.booksDone", { done: num(sp.done), total: num(sp.total) })}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}

function DailyCard({ date }: { date: Date }) {
  const p = useProgress();
  const { l, t, num, lang } = useLocalize();
  const narrow = new Intl.DateTimeFormat(lang, { weekday: "narrow" });
  const key = localDateKey(date);
  const done = new Set(p.daily[key] ?? []);
  const n = streak(p, date);

  // Saturday-first week dots, like the source's week.
  const start = new Date(date);
  start.setDate(date.getDate() - ((date.getDay() + 1) % 7));
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });

  return (
    <section className="rounded-3xl border bg-card p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold">{t("daily.title")}</h2>
          <p className="mt-1 text-xs text-muted-foreground">{t("daily.subtitle")}</p>
        </div>
        <div className="flex items-center gap-1.5 rounded-full bg-gold/10 px-2.5 py-1 text-sm text-gold">
          <Flame className="size-4" />
          <span className="font-semibold tabular-nums">{num(n)}</span>
        </div>
      </div>

      <div className="mt-5 flex justify-between">
        {week.map((d) => {
          const k = localDateKey(d);
          const isToday = k === key;
          const active = !!p.daily[k]?.length;
          return (
            <div key={k} className="flex flex-col items-center gap-1.5">
              <span className={cn("text-[11px]", isToday ? "text-foreground" : "text-muted-foreground")}>
                {narrow.format(d)}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border text-[11px]",
                  active && "border-transparent bg-gold text-black",
                  isToday && !active && "border-gold/60",
                )}
              >
                {active && <Check className="size-3.5" strokeWidth={3} />}
              </span>
            </div>
          );
        })}
      </div>

      <ul className="mt-6 space-y-2">
        {dailyProgramme.map((task) => {
          const checked = done.has(task.id);
          return (
            <li key={task.id}>
              <button
                type="button"
                onClick={() => progress.toggleDaily(task.id, key)}
                aria-pressed={checked}
                className={cn(
                  "flex w-full items-start gap-3 rounded-xl border p-3 text-start transition-colors",
                  checked ? "border-primary/30 bg-primary/8" : "hover:bg-accent/50",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                    checked && "border-primary bg-primary text-primary-foreground",
                  )}
                >
                  {checked && <Check className="size-3.5" strokeWidth={3} />}
                </span>
                <span className="min-w-0">
                  <span className={cn("block text-sm font-medium", checked && "text-muted-foreground line-through")}>
                    {l(task.title)}
                  </span>
                  <span className="block text-xs text-muted-foreground">{l(task.detail)}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function ContinueWatching() {
  const p = useProgress();
  const { l, t, num } = useLocalize();
  const last = p.last && getSeries(p.last.seriesId);
  if (!p.last || !last) return null;
  const loc = getBook(last.bookId)!;
  const scholar = getScholar(last.scholarId);
  const done = watchedCount(p, last.id, last.lessons.length);

  return (
    <section>
      <h2 className="mb-3 text-sm font-medium text-muted-foreground">{t("today.continue")}</h2>
      <Link
        to={href("/watch/:seriesId/:lesson", { seriesId: last.id, lesson: String(p.last.lesson) })}
        className="group flex items-center gap-4 rounded-2xl border bg-card p-3 pe-5 transition-colors hover:bg-accent/40"
      >
        <div className="relative">
          <BookCover book={loc.book} hue={loc.subject.hue} size="sm" />
          <span className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
            <Play className="size-5 fill-white text-white" />
          </span>
        </div>
        <div className="min-w-0 flex-1">
          <p lang="ar" className="font-arabic truncate text-lg">{loc.book.title.ar}</p>
          <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
            <ScholarAvatar scholar={scholar} className="size-5 text-[10px] ring-0" />
            <span className="truncate">{l(scholar.name)}</span>
            <span>·</span>
            <span className="shrink-0">{t("lesson.n", { n: num(p.last.lesson) })}</span>
          </div>
          <Progress value={(done / last.lessons.length) * 100} className="mt-2 h-1 bg-white/8" />
        </div>
      </Link>
    </section>
  );
}

function WeekStrip({ date }: { date: Date }) {
  const p = useProgress();
  const { l, t } = useLocalize();
  const todayId = dayIdOf(date);

  return (
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-medium text-muted-foreground">{t("today.thisWeek")}</h2>
        <Link to={href("/")} className="text-xs text-primary hover:underline">
          {t("today.fullProgram")}
        </Link>
      </div>
      <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-4 sm:overflow-visible sm:px-0 lg:grid-cols-7">
        {days.map((day) => {
          const subject = subjectFor(day.id, date);
          const current = currentEntry(subject, p);
          const book = current && chosenOption(current.entry, p);
          const isToday = day.id === todayId;
          return (
            <Link
              key={day.id}
              to={href("/subjects/:subjectId", { subjectId: subject.id })}
              style={{ "--hue": subject.hue } as React.CSSProperties}
              className={cn(
                "flex w-36 shrink-0 snap-start flex-col rounded-2xl border bg-card p-3 transition-colors hover:bg-accent/40 sm:w-auto",
                isToday && "tint-border ring-1 ring-[oklch(0.75_0.12_var(--hue)/0.4)]",
              )}
            >
              <div className="flex items-center justify-between text-[11px]">
                <span className={isToday ? "tint-fg font-semibold" : "text-muted-foreground"}>{l(day.name)}</span>
                {isToday && <span className="tint-solid size-1.5 rounded-full" />}
              </div>
              <p className="mt-2 line-clamp-2 text-sm leading-snug font-medium">{l(subject.name)}</p>
              {book && (
                <p lang="ar" className="font-arabic mt-auto truncate pt-3 text-xs text-muted-foreground">
                  {book.title.ar}
                </p>
              )}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function Today({ loaderData }: Route.ComponentProps) {
  const { t, lang } = useLocalize();
  const date = new Date(loaderData.now);

  const gregorian = new Intl.DateTimeFormat(lang, { weekday: "long", day: "numeric", month: "long" }).format(date);
  const hijri = new Intl.DateTimeFormat(`${lang}-u-ca-islamic-umalqura`, {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);

  return (
    <div className="space-y-8">
      <div>
        <p className="text-sm text-muted-foreground">
          {gregorian} · <span className="text-gold/90">{hijri}</span>
        </p>
        <h1 className="mt-1 text-3xl font-semibold tracking-tight">{t("today.greeting")}</h1>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-8">
          <TodayHero date={date} />
          <ContinueWatching />
        </div>
        <DailyCard date={date} />
      </div>

      <WeekStrip date={date} />
    </div>
  );
}
