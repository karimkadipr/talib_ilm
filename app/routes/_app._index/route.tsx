import { ArrowUpRight, ChevronDown, Layers, Repeat } from "lucide-react";
import { href, Link } from "react-router";
import { ProgressRing } from "~/components/progress-ring";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { countBooks, days, getSubject, subjects, suggestedOrder } from "~/data/curriculum";
import { useLocalize } from "~/lib/localize";
import { useProgress } from "~/lib/progress";
import { subjectProgress } from "~/lib/schedule";
import { getInstance } from "~/middleware/i18next";
import type { Route } from "./+types/route";

export async function loader({ context }: Route.LoaderArgs) {
  return { title: getInstance(context).t("program.title") };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return [{ title: loaderData?.title }];
}

const SOURCE_URL = "https://saaid.org/Minute/mm12.htm";
const PRINCIPLES = ["p1", "p2", "p3", "p4", "p5"] as const;

export default function Program() {
  const p = useProgress();
  const { l, t, num, isAr } = useLocalize();
  const totalBooks = subjects.reduce((n, s) => n + countBooks(s), 0);

  return (
    <div className="space-y-10">
      <header className="relative overflow-hidden rounded-3xl border bg-card p-6 sm:p-10">
        <div className="bg-khatam pointer-events-none absolute inset-0 mask-[radial-gradient(70%_100%_at_100%_0%,black,transparent)]" />
        <div className="relative max-w-2xl">
          <p className="text-sm text-gold">{t("program.eyebrow")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">{t("program.title")}</h1>
          <p lang="ar" className="font-arabic mt-3 text-xl text-muted-foreground">
            برنامج (علمي، عملي) مقترح لطلب العلم
          </p>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{t("program.description")}</p>
          <a
            href={SOURCE_URL}
            target="_blank"
            rel="noreferrer"
            className="mt-4 inline-flex items-center gap-1 text-sm text-primary hover:underline"
          >
            {t("program.source")}
            <ArrowUpRight className="size-3.5 rtl:-scale-x-100" />
          </a>
        </div>
        <dl className="relative mt-8 grid max-w-lg grid-cols-3 gap-4">
          {[
            [num(subjects.length), t("program.statSciences")],
            [num(totalBooks), t("program.statBooks")],
            [num(4), t("program.statLevels")],
          ].map(([value, label]) => (
            <div key={label} className="rounded-2xl border bg-background/40 p-4">
              <dd className="text-2xl font-semibold tabular-nums">{value}</dd>
              <dt className="mt-1 text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>
      </header>

      <Collapsible className="rounded-2xl border bg-card">
        <CollapsibleTrigger className="group flex w-full items-center justify-between p-5 text-start">
          <span className="font-medium">{t("program.howItWorks")}</span>
          <ChevronDown className="size-4 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <ol className="space-y-3 px-5 pb-5">
            {PRINCIPLES.map((k, i) => (
              <li key={k} className="flex gap-3 text-sm text-muted-foreground">
                <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs text-primary">
                  {num(i + 1)}
                </span>
                <span className="pt-0.5">{t(`program.${k}`)}</span>
              </li>
            ))}
          </ol>
        </CollapsibleContent>
      </Collapsible>

      <section>
        <h2 className="mb-4 text-lg font-semibold">{t("program.weekly")}</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {days.map((day) => (
            <div key={day.id} className="flex flex-col rounded-3xl border bg-card p-2">
              <div className="flex items-center justify-between px-3 pt-2 pb-3">
                <span className="text-sm font-medium">{l(day.name)}</span>
                {day.subjects.length > 1 && (
                  <span className="inline-flex items-center gap-1 text-[11px] text-muted-foreground">
                    <Repeat className="size-3" />
                    {t("program.alternating")}
                  </span>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-2">
                {day.subjects.map((id) => {
                  const subject = getSubject(id)!;
                  const sp = subjectProgress(subject, p);
                  const groupLabel = subject.groups.every((g) => g.level)
                    ? t("program.fourLevels")
                    : t("program.categories", { count: subject.groups.length });
                  return (
                    <Link
                      key={id}
                      to={href("/subjects/:subjectId", { subjectId: id })}
                      style={{ "--hue": subject.hue } as React.CSSProperties}
                      className="group flex flex-1 items-center gap-4 rounded-2xl bg-surface p-4 transition-colors hover:bg-accent/50"
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
                        <p className="mt-1.5 flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Layers className="size-3" />
                          {groupLabel} · {t("program.books", { count: countBooks(subject) })}
                        </p>
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-3xl border bg-card p-6">
        <h2 className="font-semibold">{t("program.orderTitle")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("program.orderDescription")}</p>
        <ol className="mt-5 flex flex-wrap gap-2">
          {suggestedOrder.map((id, i) => {
            const subject = getSubject(id)!;
            return (
              <li key={id}>
                <Link
                  to={href("/subjects/:subjectId", { subjectId: id })}
                  style={{ "--hue": subject.hue } as React.CSSProperties}
                  className="tint-border tint-bg flex items-center gap-2 rounded-full border py-1.5 ps-1.5 pe-4 text-sm transition-opacity hover:opacity-80"
                >
                  <span className="tint-solid flex size-6 items-center justify-center rounded-full text-xs font-semibold text-black/80">
                    {num(i + 1)}
                  </span>
                  {l(subject.name)}
                </Link>
              </li>
            );
          })}
        </ol>
      </section>
    </div>
  );
}
