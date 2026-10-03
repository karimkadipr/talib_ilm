import { cn } from "cn";
import { Check, ChevronDown, ChevronRight, Lightbulb, Lock, Repeat } from "lucide-react";
import { data, href, Link } from "react-router";
import { BookCover } from "~/components/book-cover";
import { ProgressRing } from "~/components/progress-ring";
import { ScholarAvatar } from "~/components/scholar-avatar";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { getDayOfSubject, getSubject, type Book, type Entry, type Subject } from "~/data/curriculum";
import { getScholar, seriesForBook } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { useProgress, type ProgressState } from "~/lib/progress";
import { entryStatus, groupProgress, subjectProgress } from "~/lib/schedule";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const subject = getSubject(params.subjectId);
  if (!subject) throw data(null, { status: 404 });
  return { subjectId: subject.id, title: subject.name.ar };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

function StatusChip({ status }: { status: "done" | "reading" | "todo" }) {
  const { t } = useLocalize();
  if (status === "todo") return null;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        status === "done" ? "bg-primary/12 text-primary" : "bg-gold/12 text-gold",
      )}
    >
      {status === "done" && <Check className="size-3" strokeWidth={3} />}
      {t(`status.${status}`)}
    </span>
  );
}

function BookRow({ book, subject, p }: { book: Book; subject: Subject; p: ProgressState }) {
  const { l, t, isAr } = useLocalize();
  const explanations = seriesForBook(book.id);
  const status = p.books[book.id] ?? "todo";

  return (
    <Link
      to={href("/books/:bookId", { bookId: book.id })}
      className="group flex items-center gap-4 rounded-2xl p-3 transition-colors hover:bg-accent/50"
    >
      <BookCover book={book} hue={subject.hue} size="sm" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <p lang="ar" className="font-arabic text-lg leading-snug">{book.title.ar}</p>
          <StatusChip status={status} />
        </div>
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {!isAr && <>{book.title.en} · </>}
          {l(book.author)}
        </p>
        {book.note && <p className="mt-1 line-clamp-1 text-xs text-muted-foreground/80">{l(book.note)}</p>}
      </div>
      {explanations.length > 0 && (
        <div className="hidden shrink-0 items-center gap-2 sm:flex">
          <div className="flex -space-x-2 rtl:space-x-reverse">
            {explanations.slice(0, 3).map((x) => (
              <ScholarAvatar key={x.id} scholar={getScholar(x.scholarId)} className="size-7 text-xs" />
            ))}
          </div>
          <span className="text-xs text-muted-foreground">
            {t("book.explanations", { count: explanations.length })}
          </span>
        </div>
      )}
      <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
    </Link>
  );
}

function EntryBlock({ entry, subject, p }: { entry: Entry; subject: Subject; p: ProgressState }) {
  const { t } = useLocalize();
  if (entry.options.length === 1) return <BookRow book={entry.options[0]} subject={subject} p={p} />;
  return (
    <div className="rounded-2xl border border-dashed p-1.5">
      <p className="px-3 pt-2 text-[11px] font-medium tracking-wide text-muted-foreground uppercase">
        {t("subject.chooseOne")}
      </p>
      {entry.options.map((book) => (
        <BookRow key={book.id} book={book} subject={subject} p={p} />
      ))}
    </div>
  );
}

export default function SubjectPage({ loaderData }: Route.ComponentProps) {
  const subject = getSubject(loaderData.subjectId)!;
  const day = getDayOfSubject(subject.id);
  const p = useProgress();
  const { l, t, num, isAr } = useLocalize();
  const sp = subjectProgress(subject, p);
  const sibling = day.subjects.find((id) => id !== subject.id);

  return (
    <div style={{ "--hue": subject.hue } as React.CSSProperties} className="space-y-8">
      <header className="tint-border relative overflow-hidden rounded-3xl border bg-card bg-[radial-gradient(100%_140%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.5),transparent_60%)] p-6 sm:p-8">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[linear-gradient(to_left,black,transparent_70%)] rtl:mask-[linear-gradient(to_right,black,transparent_70%)]" />
        <div className="relative flex items-start justify-between gap-6">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="tint-bg tint-fg rounded-full px-2.5 py-1 font-medium">{l(day.name)}</span>
              {sibling && (
                <Link
                  to={href("/subjects/:subjectId", { subjectId: sibling })}
                  className="inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-muted-foreground hover:text-foreground"
                >
                  <Repeat className="size-3" />
                  {t("today.alternates", { other: l(getSubject(sibling)!.name) })}
                </Link>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">{l(subject.name)}</h1>
            {!isAr && <p lang="ar" className="font-arabic mt-1 text-2xl text-muted-foreground">{subject.name.ar}</p>}
          </div>
          <ProgressRing value={sp.pct} size={84} stroke={6} className="tint-fg shrink-0">
            <span className="flex flex-col items-center leading-tight text-foreground">
              <span className="text-lg font-semibold tabular-nums">{num(sp.done)}</span>
              <span className="text-[10px] text-muted-foreground">/ {num(sp.total)}</span>
            </span>
          </ProgressRing>
        </div>
      </header>

      {subject.tip && (
        <div className="flex gap-3 rounded-2xl border border-gold/20 bg-gold/5 p-4 text-sm">
          <Lightbulb className="mt-0.5 size-4 shrink-0 text-gold" />
          <p className="leading-relaxed text-muted-foreground">{l(subject.tip)}</p>
        </div>
      )}

      <ol className="relative space-y-6">
        {subject.groups.map((group, i) => {
          const gp = groupProgress(group.entries, p);
          const prev = subject.groups[i - 1];
          // The source asks not to move past a level before mastering it.
          const gated =
            !!group.level && !!prev?.level && groupProgress(prev.entries, p).done < prev.entries.length;
          const complete = gp.done === gp.total;
          return (
            <li key={group.id} className="relative ps-12">
              {i < subject.groups.length - 1 && (
                <span className="absolute start-[17px] top-10 -bottom-6 w-px bg-border" aria-hidden />
              )}
              <span
                className={cn(
                  "absolute start-0 top-0 flex size-9 items-center justify-center rounded-full border text-sm font-semibold",
                  complete ? "tint-solid border-transparent text-black/80" : "tint-border tint-fg bg-card",
                )}
              >
                {complete ? <Check className="size-4" strokeWidth={3} /> : num(group.level ?? i + 1)}
              </span>

              <div className="flex flex-wrap items-baseline justify-between gap-2 pt-1.5">
                <div>
                  <h2 className="font-semibold">
                    {group.level ? t("level.n", { n: num(group.level) }) : l(group.label!)}
                    {group.level && (
                      <span className="ms-2 text-sm font-normal text-muted-foreground">
                        {t(`level.name${group.level}`)}
                      </span>
                    )}
                  </h2>
                  {gated && (
                    <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Lock className="size-3" />
                      {t("subject.gated", { n: num(prev.level!) })}
                    </p>
                  )}
                </div>
                <span className="text-xs text-muted-foreground tabular-nums">
                  {t("progress.booksDone", { done: num(gp.done), total: num(gp.total) })}
                </span>
              </div>

              <div className={cn("mt-3 space-y-1 rounded-3xl border bg-card p-2", gated && "opacity-70")}>
                {group.entries.map((entry) => (
                  <div key={entry.id} className={cn(entryStatus(entry, p) === "done" && "opacity-60")}>
                    <EntryBlock entry={entry} subject={subject} p={p} />
                  </div>
                ))}
              </div>
            </li>
          );
        })}
      </ol>

      {subject.further && (
        <Collapsible className="rounded-2xl border bg-card">
          <CollapsibleTrigger className="group flex w-full items-center justify-between p-5 text-start">
            <span>
              <span className="block font-medium">{t("subject.further")}</span>
              <span className="text-xs text-muted-foreground">{t("subject.furtherHint")}</span>
            </span>
            <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
          </CollapsibleTrigger>
          <CollapsibleContent>
            <ul lang="ar" className="space-y-3 px-5 pb-5">
              {subject.further.map((line) => (
                <li key={line} className="font-arabic text-lg leading-loose text-muted-foreground">
                  {line}
                </li>
              ))}
            </ul>
          </CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
