import { cn } from "cn";
import { Check, ChevronLeft, ChevronRight, Play } from "lucide-react";
import { useEffect } from "react";
import { data, href, Link } from "react-router";
import { AudioLesson } from "~/components/audio-lesson";
import { BackLink } from "~/components/back-link";
import { BookCover } from "~/components/book-cover";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { getBook } from "~/data/curriculum";
import { getScholar, getSeries, seriesForBook } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { lessonKey, progress, useProgress, watchedCount } from "~/lib/progress";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const s = getSeries(params.seriesId);
  const n = Number(params.lesson);
  if (!s || !s.lessons.some((l) => l.n === n)) throw data(null, { status: 404 });
  return { seriesId: s.id, lesson: n, title: getBook(s.bookId)!.book.title.ar };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

function Player({ videoId, children }: { videoId?: string; children: React.ReactNode }) {
  if (videoId) {
    return (
      <iframe
        className="aspect-video w-full rounded-2xl border bg-black"
        src={`https://www.youtube-nocookie.com/embed/${videoId}`}
        allow="accelerometer; autoplay; encrypted-media; picture-in-picture"
        allowFullScreen
        title="lesson"
      />
    );
  }
  return (
    <div className="relative flex aspect-video w-full items-center justify-center overflow-hidden rounded-2xl border bg-[radial-gradient(80%_80%_at_50%_40%,oklch(0.28_0.06_var(--hue)),oklch(0.12_0.01_var(--hue)))]">
      <div className="bg-khatam absolute inset-0 opacity-60" />
      {children}
    </div>
  );
}

export default function Watch({ loaderData }: Route.ComponentProps) {
  const s = getSeries(loaderData.seriesId)!;
  const n = loaderData.lesson;
  const { book, subject } = getBook(s.bookId)!;
  const scholar = getScholar(s.scholarId);
  const lesson = s.lessons.find((x) => x.n === n)!;
  const others = seriesForBook(book.id);
  const p = useProgress();
  const { l, t, num, duration, isAr } = useLocalize();
  const watched = !!p.watched[lessonKey(s.id, n)];
  const noteKey = lessonKey(s.id, n);
  const prev = s.lessons.find((x) => x.n === n - 1);
  const next = s.lessons.find((x) => x.n === n + 1);
  const done = watchedCount(p, s.id, s.lessons.length);

  useEffect(() => {
    progress.open(s.id, book.id, n);
  }, [s.id, book.id, n]);

  const lessonHref = (x: number) => href("/watch/:seriesId/:lesson", { seriesId: s.id, lesson: String(x) });
  // In RTL "previous" points right; the icons follow reading direction.
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;

  return (
    <div style={{ "--hue": subject.hue } as React.CSSProperties} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <BackLink to={`${href("/books/:bookId", { bookId: book.id })}?s=${s.scholarId}`}>
          <span lang={isAr ? "ar" : undefined}>{isAr ? book.title.ar : book.title.en}</span>
        </BackLink>
        {lesson.audioUrl ? (
          <AudioLesson
            key={noteKey}
            id={noteKey}
            src={lesson.audioUrl}
            book={book}
            hue={subject.hue}
            artist={l(scholar.name)}
            label={t("lesson.n", { n: num(n) })}
            onEnded={() => progress.toggleWatched(s.id, book.id, n, true)}
          />
        ) : (
          <Player videoId={lesson.videoId}>
            <div className="relative flex flex-col items-center text-center">
              <span className="flex size-20 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20 backdrop-blur">
                <Play className="size-8 translate-x-0.5 fill-white text-white" />
              </span>
              <p className="mt-4 text-xs text-white/60">{t("watch.noVideo")}</p>
            </div>
          </Player>
        )}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {t("lesson.n", { n: num(n) })} · {duration(lesson.minutes)}
            </p>
            <h1 lang="ar" className="font-arabic mt-1 text-3xl leading-tight">{book.title.ar}</h1>
            {!isAr && <p className="text-sm text-muted-foreground">{book.title.en}</p>}
            <div className="mt-3 flex items-center gap-3">
              <ScholarAvatar scholar={scholar} className="size-9" />
              <div className="text-sm">
                <p className="font-medium">{l(scholar.name)}</p>
                <p className="text-xs text-muted-foreground">
                  {t("progress.lessonsDone", { done: num(done), total: num(s.lessons.length) })}
                </p>
              </div>
            </div>
            {s.source && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("watch.source")}{" "}
                <a href={s.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {l(s.source.name)}
                </a>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant={watched ? "secondary" : "default"}
              className="rounded-full"
              onClick={() => progress.toggleWatched(s.id, book.id, n)}
            >
              <Check />
              {watched ? t("lesson.watched") : t("lesson.markWatched")}
            </Button>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-y py-3">
          {prev ? (
            <Button asChild variant="ghost" className="rounded-full">
              <Link to={lessonHref(prev.n)}>
                <PrevIcon />
                {t("watch.prev")}
              </Link>
            </Button>
          ) : (
            <span />
          )}
          {next && (
            <Button
              asChild
              variant="ghost"
              className="rounded-full"
              onClick={() => !watched && progress.toggleWatched(s.id, book.id, n, true)}
            >
              <Link to={lessonHref(next.n)}>
                {t("watch.next")}
                <NextIcon />
              </Link>
            </Button>
          )}
        </div>

        <Tabs defaultValue="notes">
          <TabsList>
            <TabsTrigger value="notes">{t("watch.notes")}</TabsTrigger>
            <TabsTrigger value="about">{t("watch.about")}</TabsTrigger>
          </TabsList>
          <TabsContent value="notes" className="mt-3">
            <textarea
              value={p.notes[noteKey] ?? ""}
              onChange={(e) => progress.setNote(noteKey, e.target.value)}
              placeholder={t("watch.notesPlaceholder")}
              dir="auto"
              rows={6}
              className="w-full resize-y rounded-2xl border bg-card p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
            />
            <p className="mt-1.5 text-xs text-muted-foreground">{t("watch.notesHint")}</p>
          </TabsContent>
          <TabsContent value="about" className="mt-3">
            <Link
              to={href("/books/:bookId", { bookId: book.id })}
              className="flex items-center gap-4 rounded-2xl border bg-card p-4 hover:bg-accent/40"
            >
              <BookCover book={book} hue={subject.hue} size="sm" />
              <div className="min-w-0">
                <p lang="ar" className="font-arabic text-lg">{book.title.ar}</p>
                <p className="text-sm text-muted-foreground">{l(book.author)}</p>
                {book.note && <p className="mt-1 text-xs text-muted-foreground">{l(book.note)}</p>}
              </div>
            </Link>
          </TabsContent>
        </Tabs>
      </div>

      <aside className="space-y-4 xl:sticky xl:top-22 xl:self-start">
        {others.length > 1 && (
          <div className="rounded-2xl border bg-card p-4">
            <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("watch.otherScholars")}</p>
            <div className="mt-3 space-y-1">
              {others.map((o) => {
                const sch = getScholar(o.scholarId);
                const active = o.id === s.id;
                const resumeAt =
                  o.lessons.find((x) => !p.watched[lessonKey(o.id, x.n)])?.n ?? 1;
                return (
                  <Link
                    key={o.id}
                    to={href("/watch/:seriesId/:lesson", { seriesId: o.id, lesson: String(active ? n : resumeAt) })}
                    className={cn(
                      "flex items-center gap-3 rounded-xl p-2 text-sm transition-colors",
                      active ? "bg-accent" : "hover:bg-accent/50",
                    )}
                  >
                    <ScholarAvatar scholar={sch} className="size-8 text-sm ring-0" />
                    <span className="min-w-0 flex-1 truncate">{l(sch.name)}</span>
                    <span className="text-xs text-muted-foreground">{t("lesson.count", { count: o.lessons.length })}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border bg-card">
          <p className="border-b p-4 text-xs font-medium tracking-wide text-muted-foreground uppercase">
            {t("watch.lessons")}
          </p>
          <div className="max-h-105 overflow-y-auto">
            <ol className="p-2">
              {s.lessons.map((x) => {
                const w = !!p.watched[lessonKey(s.id, x.n)];
                const current = x.n === n;
                return (
                  <li key={x.n}>
                    <Link
                      to={lessonHref(x.n)}
                      aria-current={current ? "page" : undefined}
                      className={cn(
                        "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors",
                        current ? "tint-bg" : "hover:bg-accent/50",
                      )}
                    >
                      <span
                        className={cn(
                          "flex size-6 shrink-0 items-center justify-center rounded-full text-[11px] tabular-nums",
                          w ? "bg-primary text-primary-foreground" : current ? "tint-solid text-black/80" : "border text-muted-foreground",
                        )}
                      >
                        {w ? <Check className="size-3" strokeWidth={3} /> : current ? <Play className="size-2.5 fill-current" /> : num(x.n)}
                      </span>
                      <span className={cn("flex-1", current && "font-medium")}>{t("lesson.n", { n: num(x.n) })}</span>
                      <span className="text-xs text-muted-foreground tabular-nums">{duration(x.minutes)}</span>
                    </Link>
                  </li>
                );
              })}
            </ol>
          </div>
        </div>
      </aside>
    </div>
  );
}
