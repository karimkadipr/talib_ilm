import { cn } from "cn";
import { Check, ChevronLeft, ChevronRight, Columns2, Play, Rows2 } from "lucide-react";
import { useEffect } from "react";
import { data, href, Link } from "react-router";
import { AudioLesson } from "~/components/audio-lesson";
import { BackLink } from "~/components/back-link";
import { BookCover } from "~/components/book-cover";
import { BookReader } from "~/components/book-reader";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { lessonAudioUrl } from "~/data/audio.server";
import { getBookContent } from "~/data/book-content.server";
import { getBookText } from "~/data/book-texts";
import { getBook } from "~/data/curriculum";
import { getScholar, getSeries, seriesForBook } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { usePreferences, useSetSideBySide } from "~/lib/preferences";
import { lessonKey, progress, useProgress, watchedCount } from "~/lib/progress";
import { pageMeta } from "~/lib/meta";
import { localizer, seo } from "~/lib/meta.server";
import type { Route } from "./+types/route";

export async function loader({ params, context }: Route.LoaderArgs) {
  const s = getSeries(params.seriesId);
  const n = Number(params.lesson);
  if (!s || !s.lessons.some((l) => l.n === n)) throw data(null, { status: 404 });
  const { l, t, num } = localizer(context);
  return {
    seriesId: s.id,
    lesson: n,
    // "Lesson 3 · <book> · <app>": the lesson number stays visible in a narrow tab.
    meta: seo(context, [t("lesson.n", { n: num(n) }), l(getBook(s.bookId)!.book.title)]),
    audioUrl: lessonAudioUrl(s.id, n),
    content: getBookContent(s.bookId),
  };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
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

/** Switches the lesson page between one column and the side-by-side view (wide screens only). */
function LayoutToggle({ on }: { on: boolean }) {
  const { t } = useLocalize();
  const setSideBySide = useSetSideBySide();
  const Icon = on ? Rows2 : Columns2;
  return (
    <Button
      variant="outline"
      size="sm"
      className="shrink-0 rounded-full max-lg:hidden"
      aria-pressed={on}
      title={t("watch.sideBySideHint")}
      onClick={() => setSideBySide(!on)}
    >
      <Icon />
      {on ? t("watch.singleColumn") : t("watch.sideBySide")}
    </Button>
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
  const { sideBySide } = usePreferences();
  const watched = !!p.watched[lessonKey(s.id, n)];
  const noteKey = lessonKey(s.id, n);
  const prev = s.lessons.find((x) => x.n === n - 1);
  const next = s.lessons.find((x) => x.n === n + 1);
  const done = watchedCount(p, s.id, s.lessons.length);
  const text = getBookText(book.id);
  // Side by side only makes sense with the book's text to read.
  const side = sideBySide && !!text;

  useEffect(() => {
    progress.open(s.id, book.id, n);
  }, [s.id, book.id, n]);

  const lessonHref = (x: number) => href("/watch/:seriesId/:lesson", { seriesId: s.id, lesson: String(x) });
  // In RTL "previous" points right; the icons follow reading direction.
  const PrevIcon = isAr ? ChevronRight : ChevronLeft;
  const NextIcon = isAr ? ChevronLeft : ChevronRight;
  const uiDir = isAr ? "rtl" : "ltr";

  const backLink = (
    <BackLink to={`${href("/books/:bookId", { bookId: book.id })}?s=${s.scholarId}`}>
      <span lang={isAr ? "ar" : undefined}>{isAr ? book.title.ar : book.title.en}</span>
    </BackLink>
  );

  const player = loaderData.audioUrl ? (
    <AudioLesson
      key={noteKey}
      compact={side}
      track={{
        id: noteKey,
        src: loaderData.audioUrl,
        book,
        hue: subject.hue,
        artist: l(scholar.name),
        label: t("lesson.n", { n: num(n) }),
        href: lessonHref(n),
        duration: lesson.minutes * 60,
        // Marked as listened even if the lesson ends while the listener is on another page.
        onEnded: () => progress.toggleWatched(s.id, book.id, n, true),
      }}
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
  );

  const markWatched = (
    <Button
      variant={watched ? "secondary" : "default"}
      className="rounded-full"
      onClick={() => progress.toggleWatched(s.id, book.id, n)}
    >
      <Check />
      {watched ? t("lesson.watched") : t("lesson.markWatched")}
    </Button>
  );

  const prevNext = (
    <div className="flex items-center justify-between gap-3">
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
  );

  const scholarLine = (
    <div className="flex items-center gap-3">
      <ScholarAvatar scholar={scholar} className="size-9" />
      <div className="text-sm">
        <p className="font-medium">{l(scholar.name)}</p>
        <p className="text-xs text-muted-foreground">
          {t("progress.lessonsDone", { done: num(done), total: num(s.lessons.length) })}
        </p>
      </div>
    </div>
  );

  const lessonList = (
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
  );

  const notes = (
    <>
      <textarea
        value={p.notes[noteKey] ?? ""}
        onChange={(e) => progress.setNote(noteKey, e.target.value)}
        placeholder={t("watch.notesPlaceholder")}
        dir="auto"
        rows={6}
        className="w-full resize-y rounded-2xl border bg-card p-4 text-sm leading-relaxed outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
      />
      <p className="mt-1.5 text-xs text-muted-foreground">{t("watch.notesHint")}</p>
    </>
  );

  // The side view's lessons and notes: under the player on wide screens, after the text on phones.
  const sideTabs = (
    <Tabs defaultValue="lessons" dir={uiDir}>
      <TabsList>
        <TabsTrigger value="lessons">{t("watch.lessons")}</TabsTrigger>
        <TabsTrigger value="notes">{t("watch.notes")}</TabsTrigger>
      </TabsList>
      <TabsContent value="lessons" className="mt-3">
        <div className="scrollbar-slim max-h-80 overflow-y-auto rounded-2xl border bg-card">{lessonList}</div>
      </TabsContent>
      <TabsContent value="notes" className="mt-3">
        {notes}
      </TabsContent>
    </Tabs>
  );

  if (side && text) {
    // The player and the lesson on the left (sticky), the book's text filling the right, whatever
    // the page's direction: the grid is laid out left-to-right and each side keeps the page's own.
    return (
      <div
        dir="ltr"
        style={{ "--hue": subject.hue } as React.CSSProperties}
        className="grid items-start gap-6 lg:grid-cols-[minmax(0,23rem)_minmax(0,1fr)]"
      >
        <aside
          dir={uiDir}
          className="scrollbar-slim min-w-0 space-y-4 lg:sticky lg:top-22 lg:max-h-[calc(100dvh-6.5rem)] lg:overflow-y-auto lg:pe-1"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">{backLink}</div>
            <LayoutToggle on />
          </div>
          {player}
          <div className="space-y-4 rounded-2xl border bg-card p-4">
            <div>
              <p className="text-sm text-muted-foreground">
                {t("lesson.n", { n: num(n) })} · {duration(lesson.minutes)}
              </p>
              <h1 lang="ar" className="font-arabic mt-1 text-2xl leading-tight">
                {book.title.ar}
              </h1>
            </div>
            {scholarLine}
            <div className="[&>button]:w-full">{markWatched}</div>
            <div className="-mx-2 border-t pt-2">{prevNext}</div>
          </div>
          <div className="max-lg:hidden">{sideTabs}</div>
        </aside>

        <section dir={uiDir} aria-label={t("reader.tab")} className="min-w-0">
          <BookReader bookId={book.id} text={text} content={loaderData.content} fill />
        </section>
        <div dir={uiDir} className="min-w-0 lg:hidden">
          {sideTabs}
        </div>
      </div>
    );
  }

  return (
    <div style={{ "--hue": subject.hue } as React.CSSProperties} className="grid gap-6 xl:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">{backLink}</div>
          {text && <LayoutToggle on={false} />}
        </div>
        {player}

        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <p className="text-sm text-muted-foreground">
              {t("lesson.n", { n: num(n) })} · {duration(lesson.minutes)}
            </p>
            <h1 lang="ar" className="font-arabic mt-1 text-3xl leading-tight">{book.title.ar}</h1>
            {!isAr && <p className="text-sm text-muted-foreground">{book.title.en}</p>}
            <div className="mt-3">{scholarLine}</div>
            {s.source && (
              <p className="mt-3 text-xs text-muted-foreground">
                {t("watch.source")}{" "}
                <a href={s.source.url} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {l(s.source.name)}
                </a>
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">{markWatched}</div>
        </div>

        <div className="border-y py-3">{prevNext}</div>

        {/* With the book's text, reading along is the first tab. */}
        {/* Radix defaults to ltr; follow the page so Arabic tabs and their content read right-to-left. */}
        <Tabs defaultValue={text ? "text" : "notes"} dir={uiDir}>
          <TabsList>
            {text && <TabsTrigger value="text">{t("reader.tab")}</TabsTrigger>}
            <TabsTrigger value="notes">{t("watch.notes")}</TabsTrigger>
            <TabsTrigger value="about">{t("watch.about")}</TabsTrigger>
          </TabsList>
          {text && (
            <TabsContent value="text" className="mt-3">
              <BookReader bookId={book.id} text={text} content={loaderData.content} />
            </TabsContent>
          )}
          <TabsContent value="notes" className="mt-3">
            {notes}
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
                const resumeAt = o.lessons.find((x) => !p.watched[lessonKey(o.id, x.n)])?.n ?? 1;
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
          <div className="max-h-105 overflow-y-auto">{lessonList}</div>
        </div>
      </aside>
    </div>
  );
}
