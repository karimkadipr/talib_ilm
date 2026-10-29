import { cn } from "cn";
import { CalendarDays, Flame, GraduationCap, Play, Settings, Sun } from "lucide-react";
import { href, Link, NavLink, useLocation, useNavigation } from "react-router";
import { CategoryIcon } from "~/components/category-icon";
import { InstallPrompt } from "~/components/install-prompt";
import { LanguageSwitcher } from "~/components/language-switcher";
import { LogoMark } from "~/components/logo";
import { MiniPlayer } from "~/components/mini-player";
import { SettingsDialog } from "~/components/settings-dialog";
import { Button } from "~/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "~/components/ui/dropdown-menu";
import { categories, itemInfo } from "~/data/categories";
import { useLocalize } from "~/lib/localize";
import { useMiniPlayerVisible } from "~/lib/player";
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

function Sidebar() {
  const { l, t } = useLocalize();
  const { programme } = usePreferences();
  const { pathname } = useLocation();

  return (
    <aside className="fixed inset-y-0 start-0 z-30 hidden w-80 flex-col border-e bg-sidebar lg:flex">
      <Link to="/" className="flex h-16 items-center gap-3 px-5">
        <LogoMark />
        <span className="font-semibold tracking-tight">{t("appName")}</span>
      </Link>

      <nav className="scrollbar-slim flex-1 space-y-1 overflow-y-auto px-3 py-2 [scrollbar-gutter:stable]">
        {programme && (
          <div className="space-y-1 pb-4">
            <NavLink to={href("/program")} className={navClass}>
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
              className={({ isActive }) =>
                cn(
                  navClass({
                    // With its pages left out of the sidebar, the category itself marks where the reader is.
                    isActive:
                      isActive ||
                      (!!category.hideItemsInSidebar &&
                        category.items.some((i) => pathname.startsWith(itemInfo(i).to))),
                  }),
                  "font-medium text-sidebar-foreground",
                )
              }
            >
              <CategoryIcon id={category.id} className="size-4" />
              <span className="truncate">{l(category.name)}</span>
            </NavLink>
            {!category.hideItemsInSidebar && (
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
            )}
          </div>
        ))}
      </nav>
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
      "flex min-w-0 flex-1 flex-col items-center gap-1 py-2 text-[11px] tracking-tight max-[400px]:text-[10px]",
      isActive ? "text-primary" : "text-muted-foreground",
    );
  const resume = p.last
    ? href("/watch/:seriesId/:lesson", { seriesId: p.last.seriesId, lesson: String(p.last.lesson) })
    : programme
      ? href("/today")
      : href("/categories/:categoryId", { categoryId: categories[0].id });

  return (
    <nav className="flex border-t bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden">
      {categories.map((category) => (
        <NavLink key={category.id} to={href("/categories/:categoryId", { categoryId: category.id })} className={item}>
          <CategoryIcon id={category.id} className="size-5" />
          <span className="max-w-full truncate">{l(category.shortName ?? category.name)}</span>
        </NavLink>
      ))}
      {/* With the programme on, one tab gathers it, today's lessons and "Continue"; without it, just "Continue". */}
      {programme ? (
        <MyStudyMenu resume={p.last ? resume : undefined} className={item} />
      ) : (
        <NavLink to={resume} className={item}>
          <Play className="size-5" />
          <span className="max-w-full truncate">{t("nav.continue")}</span>
        </NavLink>
      )}
    </nav>
  );
}

/** Phone tab opening a menu of the programme, today's lessons and (if any) the last lesson. */
function MyStudyMenu({ resume, className }: { resume?: string; className: (s: { isActive: boolean }) => string }) {
  const { t } = useLocalize();
  const { pathname } = useLocation();
  const links = [
    { to: href("/program"), label: t("nav.program"), Icon: CalendarDays, active: pathname === "/program" },
    { to: href("/today"), label: t("nav.today"), Icon: Sun, active: pathname.startsWith("/today") },
    // "Continue" only once a lesson has been started; before that it would just repeat "Today".
    ...(resume ? [{ to: resume, label: t("nav.continue"), Icon: Play, active: pathname.startsWith("/watch/") }] : []),
  ];
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className={cn(className({ isActive: links.some((x) => x.active) }), "outline-none")}>
        <GraduationCap className="size-5" />
        <span className="max-w-full truncate">{t("nav.mine")}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent side="top" align="end" sideOffset={8} collisionPadding={12} className="min-w-52 rounded-xl p-1.5">
        {links.map(({ to, label, Icon, active }) => (
          <DropdownMenuItem key={label} asChild className={cn("gap-3 rounded-lg px-3 py-2.5", active && "text-primary")}>
            <Link to={to} aria-current={active ? "page" : undefined}>
              <Icon className={cn("size-4.5", active && "text-primary")} />
              {label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
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
  const mini = useMiniPlayerVisible();
  return (
    <div className="min-h-dvh">
      <NavigationProgress />
      <InstallPrompt />
      <Sidebar />
      <div className="lg:ps-80">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl sm:px-6">
          <Link to="/" className="flex items-center gap-2 lg:hidden">
            <LogoMark className="size-7" />
            <span className="font-semibold tracking-tight">{t("appName")}</span>
          </Link>
          <div className="ms-auto flex items-center gap-2">
            <StreakPill />
            <LanguageSwitcher />
            <SettingsDialog
              trigger={
                <Button variant="ghost" size="icon" aria-label={t("settings.title")} title={t("settings.title")}>
                  <Settings className="size-4" />
                </Button>
              }
            />
          </div>
        </header>
        <main
          className={cn("mx-auto max-w-6xl px-4 pt-6 sm:px-6", mini ? "pb-44 lg:pb-32" : "pb-28 lg:pb-12")}
        >
          {children}
        </main>
      </div>
      {/* Bottom stack: the mini player (while something plays off-page) above the phone tab bar. */}
      <div className="fixed inset-x-0 bottom-0 z-30 lg:start-80">
        <MiniPlayer />
        <MobileNav />
      </div>
    </div>
  );
}
