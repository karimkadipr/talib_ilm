import { cn } from "cn";
import { AudioLines, BookOpen, CalendarDays, Flame, Play, Sun } from "lucide-react";
import { href, Link, NavLink, useNavigation } from "react-router";
import { DuaHandsIcon } from "~/components/dua-hands-icon";
import { LanguageSwitcher } from "~/components/language-switcher";
import { LogoMark } from "~/components/logo";
import { ProgrammeToggle } from "~/components/programme-toggle";
import { categories, itemInfo } from "~/data/categories";
import { useLocalize } from "~/lib/localize";
import { usePreferences } from "~/lib/preferences";
import { streak, useProgress } from "~/lib/progress";

function navClass({ isActive }: { isActive: boolean }) {
  return cn(
    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
    isActive
      ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
      : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
  );
}

function CategoryIcon({ id, className }: { id: string; className?: string }) {
  const Icon = id === "adhkar" ? DuaHandsIcon : id === "quran" ? AudioLines : BookOpen;
  return <Icon className={className} />;
}

function Sidebar() {
  const { l, t } = useLocalize();
  const { programme } = usePreferences();

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-64 flex-col border-e bg-sidebar lg:flex">
      <Link to="/" className="flex h-16 items-center gap-3 px-5">
        <LogoMark />
        <span className="font-semibold tracking-tight">{t("appName")}</span>
      </Link>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        {programme && (
          <div className="space-y-1 pb-4">
            <NavLink to="/" end className={navClass}>
              <CalendarDays className="size-4" />
              {t("nav.program")}
            </NavLink>
            <NavLink to={href("/today")} className={navClass}>
              <Sun className="size-4" />
              {t("nav.today")}
            </NavLink>
          </div>
        )}

        {categories.map((category) => (
          <div key={category.id} className="space-y-1">
            <NavLink
              to={href("/categories/:categoryId", { categoryId: category.id })}
              className={(s) => cn(navClass(s), "font-medium text-sidebar-foreground")}
            >
              <CategoryIcon id={category.id} className="size-4" />
              <span className="truncate">{l(category.name)}</span>
            </NavLink>
            <div className="ms-5 space-y-0.5 border-s ps-2">
              {category.items.map((item) => {
                const info = itemInfo(item);
                return (
                  <NavLink
                    key={item.id}
                    to={info.to}
                    className={navClass}
                    style={{ "--hue": info.hue } as React.CSSProperties}
                  >
                    <span className="tint-solid size-2 shrink-0 rounded-full" />
                    <span className="truncate">{l(info.name)}</span>
                  </NavLink>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="m-3 space-y-3 rounded-xl border bg-card/60 p-3">
        <ProgrammeToggle hint={false} />
        <p className="text-xs text-muted-foreground">{t("shell.storageNotice")}</p>
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
  const { l, t } = useLocalize();
  const p = useProgress();
  const { programme } = usePreferences();
  const item = ({ isActive }: { isActive: boolean }) =>
    cn(
      "flex flex-1 flex-col items-center gap-1 py-2 text-[11px]",
      isActive ? "text-primary" : "text-muted-foreground",
    );
  const resume = p.last
    ? href("/watch/:seriesId/:lesson", { seriesId: p.last.seriesId, lesson: String(p.last.lesson) })
    : programme
      ? href("/today")
      : href("/categories/:categoryId", { categoryId: categories[0].id });

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 flex border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {programme && (
        <NavLink to="/" end className={item}>
          <CalendarDays className="size-5" />
          {t("nav.program")}
        </NavLink>
      )}
      {programme && (
        <NavLink to={href("/today")} className={item}>
          <Sun className="size-5" />
          {t("nav.today")}
        </NavLink>
      )}
      {categories.map((category) => (
        <NavLink key={category.id} to={href("/categories/:categoryId", { categoryId: category.id })} className={item}>
          <CategoryIcon id={category.id} className="size-5" />
          {l(category.name)}
        </NavLink>
      ))}
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
