import { CalendarDays, Headphones, Layers, Moon, Sun } from "lucide-react";
import { data, href, Link } from "react-router";
import { ProgrammeToggle } from "~/components/programme-toggle";
import { ProgressRing } from "~/components/progress-ring";
import { getAdhkarCollection } from "~/data/adhkar";
import { getAdhkar } from "~/data/adhkar.server";
import { getCategory, itemInfo } from "~/data/categories";
import { countBooks, getSubject, type Subject } from "~/data/curriculum";
import { seriesForBook } from "~/data/explanations";
import { useLocalize } from "~/lib/localize";
import { useAdhkarDone } from "~/lib/adhkar-progress";
import { usePreferences } from "~/lib/preferences";
import { useProgress } from "~/lib/progress";
import { subjectProgress } from "~/lib/schedule";
import type { Route } from "./+types/route";

export async function loader({ params }: Route.LoaderArgs) {
  const category = getCategory(params.categoryId);
  if (!category) throw data(null, { status: 404 });
  // Each adhkār collection's repetition counts, for its "done today" figure.
  const adhkarCounts = Object.fromEntries(
    category.items.filter((i) => i.kind === "adhkar").map((i) => [i.id, getAdhkar(i.id as "sabah" | "masaa").map((d) => d.count)]),
  );
  return { categoryId: category.id, title: category.name.ar, adhkarCounts };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

/** Books of a subject that have at least one recorded explanation in the app. */
function booksWithAudio(subject: Subject) {
  let n = 0;
  for (const g of subject.groups)
    for (const e of g.entries) for (const b of e.options) if (seriesForBook(b.id).length) n++;
  return n;
}

function SubjectCard({ subject }: { subject: Subject }) {
  const p = useProgress();
  const { l, t, num, isAr } = useLocalize();
  const sp = subjectProgress(subject, p);
  return (
    <Link
      to={itemInfo({ kind: "subject", id: subject.id }).to}
      style={{ "--hue": subject.hue } as React.CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <ProgressRing value={sp.pct} className="tint-fg">
        <span className="text-foreground tabular-nums">{num(sp.pct)}%</span>
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{l(subject.name)}</p>
        {!isAr && (
          <p lang="ar" className="font-arabic text-sm text-muted-foreground">
            {subject.name.ar}
          </p>
        )}
        <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <Layers className="size-3" />
            {t("program.books", { count: countBooks(subject) })}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Headphones className="size-3" />
            {t("category.withAudio", { count: num(booksWithAudio(subject)) })}
          </span>
        </p>
      </div>
    </Link>
  );
}

function AdhkarCard({ id, counts }: { id: string; counts: number[] }) {
  const collection = getAdhkarCollection(id)!;
  const done = useAdhkarDone(id, counts.length);
  const { l, t, num, isAr } = useLocalize();
  const finished = counts.filter((c, i) => done[i] >= c).length;
  const pct = counts.length ? Math.round((finished / counts.length) * 100) : 0;
  const Icon = collection.icon === "sun" ? Sun : Moon;
  return (
    <Link
      to={itemInfo({ kind: "adhkar", id }).to}
      style={{ "--hue": collection.hue } as React.CSSProperties}
      className="group flex items-center gap-4 rounded-2xl border bg-card p-4 transition-colors hover:bg-accent/50"
    >
      <ProgressRing value={pct} className="tint-fg">
        <Icon className="size-5 text-foreground" />
      </ProgressRing>
      <div className="min-w-0 flex-1">
        <p className="font-medium">{l(collection.name)}</p>
        {!isAr && (
          <p lang="ar" className="font-arabic text-sm text-muted-foreground">
            {collection.name.ar}
          </p>
        )}
        <p className="mt-1.5 text-xs text-muted-foreground">
          {t("adhkar.progress", { done: num(finished), total: num(counts.length) })}
        </p>
      </div>
    </Link>
  );
}

export default function CategoryPage({ loaderData }: Route.ComponentProps) {
  const category = getCategory(loaderData.categoryId)!;
  const { programme } = usePreferences();
  const { l, t, isAr } = useLocalize();

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[radial-gradient(70%_100%_at_100%_0%,black,transparent)]" />
        <div className="relative max-w-2xl">
          <p className="text-sm text-gold">{t("category.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{l(category.name)}</h1>
          {!isAr && (
            <p lang="ar" className="font-arabic mt-3 text-xl text-muted-foreground">
              {category.name.ar}
            </p>
          )}
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{l(category.description)}</p>
        </div>
      </header>

      <section>
        <h2 className="mb-4 text-lg font-semibold">
          {category.items.every((i) => i.kind === "subject") ? t("category.sciences") : t("category.pages")}
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {category.items.map((item) =>
            item.kind === "subject" ? (
              <SubjectCard key={item.id} subject={getSubject(item.id)!} />
            ) : (
              <AdhkarCard key={item.id} id={item.id} counts={loaderData.adhkarCounts[item.id] ?? []} />
            ),
          )}
        </div>
      </section>

      {category.items.some((i) => i.kind === "subject") && (
      <section className="flex flex-col gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-center">
        <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <CalendarDays className="size-5" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm leading-relaxed text-muted-foreground">{t("category.programmeBody")}</p>
          {programme && (
            <Link to="/" className="mt-1 inline-block text-sm text-primary hover:underline">
              {t("category.openProgramme")}
            </Link>
          )}
        </div>
        <ProgrammeToggle hint={false} className="sm:w-56" />
      </section>
      )}
    </div>
  );
}
