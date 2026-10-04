import { cn } from "cn";
import { BookCheck, BookOpen, Check, ChevronRight, Clock, Play, Undo2, Video } from "lucide-react";
import { data, href, Link, useSearchParams } from "react-router";
import { BackLink } from "~/components/back-link";
import { BookCover } from "~/components/book-cover";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Button } from "~/components/ui/button";
import { Progress } from "~/components/ui/progress";
import { getBook } from "~/data/curriculum";
import { getScholar, seriesForBook, totalMinutes, type Series } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { lessonKey, progress, useProgress, watchedCount } from "~/lib/progress";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const loc = getBook(params.bookId);
  if (!loc) throw data(null, { status: 404 });
  return { bookId: loc.book.id, title: loc.book.title.ar };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

function ScholarCard({ s, selected }: { s: Series; selected: boolean }) {
  const p = useProgress();
  const { l, t, num, duration, isAr } = useLocalize();
  const scholar = getScholar(s.scholarId);
  const done = watchedCount(p, s.id, s.lessons.length);
  const [params] = useSearchParams();
  const next = new URLSearchParams(params);
  next.set("s", s.scholarId);

  return (
    <Link
      to={`?${next}`}
      replace
      preventScrollReset
      aria-current={selected}
      style={{ "--hue": scholar.hue } as React.CSSProperties}
      className={cn(
        "flex w-64 shrink-0 snap-start flex-col rounded-2xl border bg-card p-4 transition-all",
        selected
          ? "border-[oklch(0.75_0.12_var(--hue)/0.5)] bg-[oklch(0.3_0.05_var(--hue)/0.25)] ring-1 ring-[oklch(0.75_0.12_var(--hue)/0.35)]"
          : "hover:bg-accent/40",
      )}
    >
      <div className="flex items-center gap-3">
        <ScholarAvatar scholar={scholar} className="size-11 text-xl" />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium">{l(scholar.name)}</p>
          {!isAr && (
            <p lang="ar" className="font-arabic truncate text-xs text-muted-foreground">
            {scholar.name.ar}
          </p>
          )}
        </div>
      </div>
      <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <Video className="size-3.5" />
          {t("lesson.count", { count: s.lessons.length })}
        </span>
        <span className="inline-flex items-center gap-1">
          <Clock className="size-3.5" />
          {duration(totalMinutes(s))}
        </span>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <Progress value={(done / s.lessons.length) * 100} className="h-1 bg-white/8" />
        <span className="text-[11px] text-muted-foreground tabular-nums">
          {num(done)}/{num(s.lessons.length)}
        </span>
      </div>
    </Link>
  );
}

function LessonList({ s, bookId }: { s: Series; bookId: string }) {
  const p = useProgress();
  const { l, t, num, duration } = useLocalize();
  const done = watchedCount(p, s.id, s.lessons.length);
  const next = s.lessons.find((x) => !p.watched[lessonKey(s.id, x.n)]) ?? s.lessons[0];

  return (
    <div className="rounded-3xl border bg-card">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
        <div>
          <p className="text-sm text-muted-foreground">
            {t("progress.lessonsDone", { done: num(done), total: num(s.lessons.length) })}
          </p>
          {s.source && (
            <p className="mt-0.5 text-xs text-muted-foreground">
              {t("watch.source")}{" "}
              <a href={s.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                {l(s.source.name)}
              </a>
            </p>
          )}
        </div>
        <Button asChild className="rounded-full">
          <Link to={href("/watch/:seriesId/:lesson", { seriesId: s.id, lesson: String(next.n) })}>
            <Play className="fill-current" />
            {done ? t("book.resumeAt", { n: num(next.n) }) : t("book.start")}
          </Link>
        </Button>
      </div>
      <ol className="max-h-[560px] divide-y overflow-y-auto">
        {s.lessons.map((lesson) => {
          const watched = !!p.watched[lessonKey(s.id, lesson.n)];
          return (
            <li key={lesson.n} className="group flex items-center gap-4 px-4 py-3 sm:px-5">
              <button
                type="button"
                onClick={() => progress.toggleWatched(s.id, bookId, lesson.n)}
                aria-pressed={watched}
                aria-label={watched ? t("lesson.markUnwatched") : t("lesson.markWatched")}
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border text-xs tabular-nums transition-colors",
                  watched ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:border-foreground/40",
                )}
              >
                {watched ? <Check className="size-3.5" strokeWidth={3} /> : num(lesson.n)}
              </button>
              <Link
                to={href("/watch/:seriesId/:lesson", { seriesId: s.id, lesson: String(lesson.n) })}
                className="flex min-w-0 flex-1 items-center gap-3"
              >
                <span className={cn("flex-1 truncate text-sm", watched && "text-muted-foreground")}>
                  {t("lesson.n", { n: num(lesson.n) })}
                </span>
                <span className="text-xs text-muted-foreground tabular-nums">{duration(lesson.minutes)}</span>
                <Play className="size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
              </Link>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function BookPage({ loaderData }: Route.ComponentProps) {
  const { book, subject, group, entry, day } = getBook(loaderData.bookId)!;
  const p = useProgress();
  const { l, t, num, isAr } = useLocalize();
  const [params] = useSearchParams();
  const explanations = seriesForBook(book.id);
  const selected = explanations.find((s) => s.scholarId === params.get("s")) ?? explanations[0];
  const status = p.books[book.id];
  const alternatives = entry.options.filter((b) => b.id !== book.id);

  return (
    <div style={{ "--hue": subject.hue } as React.CSSProperties} className="space-y-10">
      {/* Hero, after streaming title pages: cover + title + primary actions. */}
      <section className="relative -mx-4 -mt-6 overflow-hidden px-4 pt-10 pb-8 sm:-mx-6 sm:px-6 sm:pt-14">
        <div className="absolute inset-0 bg-[radial-gradient(90%_80%_at_20%_0%,oklch(0.32_0.07_var(--hue)/0.7),transparent_70%)] rtl:bg-[radial-gradient(90%_80%_at_80%_0%,oklch(0.32_0.07_var(--hue)/0.7),transparent_70%)]" />
        <div className="bg-khatam absolute inset-0 mask-[linear-gradient(to_bottom,black,transparent)]" />
        <BackLink to={href("/subjects/:subjectId", { subjectId: subject.id })} className="relative -mt-4 mb-6 sm:-mt-6">
          {l(subject.name)}
        </BackLink>
        <div className="relative flex flex-col gap-8 sm:flex-row sm:items-end">
          <BookCover book={book} hue={subject.hue} size="lg" className="shadow-2xl shadow-black/50" />
          <div className="min-w-0 flex-1">
            <nav className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
              <Link to={href("/subjects/:subjectId", { subjectId: subject.id })} className="hover:text-foreground">
                {l(day.name)} · {l(subject.name)}
              </Link>
              <ChevronRight className="size-3 rtl:rotate-180" />
              <span>{group.level ? t("level.n", { n: num(group.level) }) : l(group.label!)}</span>
            </nav>
            <h1 lang="ar" className="font-arabic mt-3 text-4xl leading-tight sm:text-5xl">
              {book.title.ar}
            </h1>
            {!isAr && <p className="mt-2 text-lg text-foreground/80">{book.title.en}</p>}
            <p className="mt-1 text-muted-foreground">{l(book.author)}</p>
            {book.note && (
              <p className="tint-border mt-4 max-w-xl border-s-2 ps-3 text-sm text-muted-foreground">{l(book.note)}</p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {status === "done" ? (
                <Button variant="secondary" className="rounded-full" onClick={() => progress.setBook(book.id, "reading")}>
                  <Undo2 />
                  {t("book.markUndone")}
                </Button>
              ) : (
                <>
                  {status !== "reading" && (
                    <Button className="rounded-full" onClick={() => progress.setBook(book.id, "reading")}>
                      <BookOpen />
                      {t("book.startReading")}
                    </Button>
                  )}
                  <Button
                    variant={status === "reading" ? "default" : "secondary"}
                    className="rounded-full"
                    onClick={() => progress.setBook(book.id, "done")}
                  >
                    <BookCheck />
                    {t("book.markDone")}
                  </Button>
                </>
              )}
              {status && (
                <span className={cn("text-sm", status === "done" ? "text-primary" : "text-gold")}>
                  {t(`status.${status}`)}
                </span>
              )}
            </div>
          </div>
        </div>

        {alternatives.length > 0 && (
          <div className="relative mt-8 flex flex-wrap items-center gap-2 text-sm">
            <span className="text-muted-foreground">{t("book.orInstead")}</span>
            {alternatives.map((b) => (
              <Link
                key={b.id}
                to={href("/books/:bookId", { bookId: b.id })}
                className="font-arabic rounded-full border bg-card/60 px-3 py-1 text-base hover:bg-accent"
              >
                {b.title.ar} <span className="font-sans text-xs text-muted-foreground">— {l(b.author)}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      <section>
        <div className="mb-4 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">{t("book.explanationsTitle")}</h2>
            <p className="text-sm text-muted-foreground">{t("book.explanationsHint")}</p>
          </div>
        </div>

        {selected ? (
          <div className="space-y-5">
            <div className="-mx-4 flex snap-x gap-3 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
              {explanations.map((s) => (
                <ScholarCard key={s.id} s={s} selected={s.id === selected.id} />
              ))}
            </div>
            <LessonList key={selected.id} s={selected} bookId={book.id} />
          </div>
        ) : (
          <div className="flex flex-col items-center rounded-3xl border border-dashed bg-card/50 px-6 py-14 text-center">
            <div className="tint-bg tint-fg flex size-14 items-center justify-center rounded-2xl">
              <Video className="size-6" />
            </div>
            <p className="mt-4 font-medium">{t("book.noExplanations")}</p>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">{t("book.noExplanationsHint")}</p>
          </div>
        )}
      </section>
    </div>
  );
}
