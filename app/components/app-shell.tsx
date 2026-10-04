import { cn } from "cn";
import { CalendarDays, Flame, Play, Sun } from "lucide-react";
import { href, Link, NavLink, useNavigation } from "react-router";
import { LanguageSwitcher } from "~/components/language-switcher";
import { LogoMark } from "~/components/logo";
import { days, getSubject } from "~/data/curriculum";
import { useLocalize } from "~/lib/localize";
import { streak, useProgress } from "~/lib/progress";

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  );
}

function Sidebar() {
  const { l, t } = useLocalize();

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-sidebar lg:flex">
      <Link to="/" className="flex h-16 items-center gap-3 px-5">
        <LogoMark />
        <span className="font-semibold tracking-tight">{t("appName")}</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <NavLink to="/" end className={navClass}>
          <CalendarDays className="size-4" />
          {t("nav.program")}
        </NavLink>
        <NavLink to={href("/today")} className={navClass}>
          <Sun className="size-4" />
          {t("nav.today")}
        </NavLink>

        <p className="px-3 pt-6 pb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
          {t("nav.week")}
        </p>
        {days.map((day) => (
          <div key={day.id} className="pb-1">
            <p className="px-3 pt-1 text-[11px] text-muted-foreground/70">{l(day.name)}</p>
            {day.subjects.map((id) => {
              const subject = getSubject(id)!;
              return (
                <NavLink
                  key={id}
                  to={href("/subjects/:subjectId", { subjectId: id })}
                  className={navClass}
                  style={{ "--hue": subject.hue } as React.CSSProperties}
                >
                  <span className="tint-solid size-2 rounded-full" />
                  <span className="truncate">{l(subject.name)}</span>
                </NavLink>
              );
            })}
          </div>
        ))}
      </nav>

      <div className="m-3 rounded-xl border bg-card/60 p-3 text-xs text-muted-foreground">
        {t("shell.storageNotice")}
      </div>
    </aside>
  );
}

function StreakPill() {
  const p = useProgress();
  const { num, t } = useLocalize();
  const n = streak(p);
  return (
    <div
      className="flex items-center gap-1.5 rounded-full border bg-card px-3 py-1.5 text-sm"
      title={t("shell.streakTitle")}
    >
      <Flame className={cn("size-4", n ? "fill-gold/30 text-gold" : "text-muted-foreground")} />
      <span className="font-medium tabular-nums">{num(n)}</span>
    </div>
  );
}

function MobileNav() {
  const { t } = useLocalize();
  const p = useProgress();
  const item = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-1 flex-col items-center gap-1 py-2 text-[11px]",
      isActive ? "text-primary" : "text-muted-foreground",
    );
  const resume = p.last
    ? href("/watch/:seriesId/:lesson", { seriesId: p.last.seriesId, lesson: String(p.last.lesson) })
    : href("/today");

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      <NavLink to="/" end className={item}>
        <CalendarDays className="size-5" />
        {t("nav.program")}
      </NavLink>
      <NavLink to={href("/today")} className={item}>
        <Sun className="size-5" />
        {t("nav.today")}
      </NavLink>
      <NavLink to={resume} className={item}>
        <Play className="size-5" />
        {t("nav.continue")}
      </NavLink>
    </nav>
  );
}

/** Thin bar along the top while a page is loading; waits a moment so instant navigations don't flash it. */
function NavigationProgress() {
  const { t } = useLocalize();
  const busy = useNavigation().state !== "idle";
  return (
    <div
      role="progressbar"
      aria-label={t("nav.loading")}
      aria-hidden={!busy}
      className={cn(
        "pointer-events-none fixed inset-x-0 top-0 z-50 h-0.5 overflow-hidden transition-opacity",
        busy ? "opacity-100 delay-150 duration-200" : "opacity-0 duration-300",
      )}
    >
      <div className="h-full w-full origin-left bg-[linear-gradient(90deg,transparent,var(--primary),var(--gold),transparent)] motion-safe:animate-indeterminate" />
    </div>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const { t } = useLocalize();
  return (
    <div className="min-h-dvh">
      <NavigationProgress />
      <Sidebar />
      <div className="lg:ps-64">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <LogoMark className="size-7" />
            <span className="font-semibold tracking-tight">{t("appName")}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <StreakPill />
            <LanguageSwitcher />
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 pt-6 pb-28 sm:px-6 lg:pb-12">{children}</main>
      </div>
      <MobileNav />
    </div>
  );
}
