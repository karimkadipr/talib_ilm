import { cn } from "cn";
import { Download, Share, SquarePlus } from "lucide-react";
import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useLocalize } from "~/lib/localize";

// Invites phone visitors to install the app (home-screen icon, full screen). Chromium browsers hand us
// their install prompt (beforeinstallprompt) to open from our own button; iOS has none, so there we
// show the two taps of Safari's "Add to Home Screen". Never shown inside the installed app. Each "Not now"
// keeps it away longer (the next day, then 3 days, a week, two weeks, then monthly), and "Don't ask
// again" for good; the settings keep a way to install it (InstallSection) meanwhile.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "islamic-studies:install-prompt:v1";
/** Days to wait after the 1st, 2nd… "Not now" (the last one repeating). */
const WAIT_DAYS = [1, 3, 7, 14, 30];

type Saved = { dismissedAt?: number; dismissals?: number; never?: boolean; installed?: boolean };

function saved(): Saved {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
}

/** After "Not now" (or the browser's prompt turned down): wait longer than the time before. */
function dismiss() {
  const s = saved();
  save({ ...s, dismissedAt: Date.now(), dismissals: (s.dismissals ?? 0) + 1 });
}

/** Whether a "Not now" has had its wait, counted in calendar days ("the next day" is tomorrow morning). */
function waited(s: Saved) {
  if (!s.dismissedAt) return true;
  const wait = WAIT_DAYS[Math.min((s.dismissals ?? 1) - 1, WAIT_DAYS.length - 1)];
  const due = new Date(s.dismissedAt);
  due.setHours(0, 0, 0, 0);
  due.setDate(due.getDate() + wait);
  return Date.now() >= due.getTime();
}

function save(value: Saved) {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(value));
  } catch {
    // Storage blocked: the prompt may come back next visit.
  }
}

// Caught at module load: the browser can fire it before React has hydrated.
let deferred: BeforeInstallPromptEvent | null = null;
const listeners = new Set<() => void>();
if (typeof window !== "undefined") {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault(); // We show our own invitation instead of the browser's mini-infobar.
    deferred = e as BeforeInstallPromptEvent;
    listeners.forEach((l) => l());
  });
  window.addEventListener("appinstalled", () => {
    deferred = null;
    save({ installed: true });
    listeners.forEach((l) => l());
  });
}

function isStandalone() {
  return window.matchMedia("(display-mode: standalone)").matches || !!(navigator as { standalone?: boolean }).standalone;
}

/** How this browser can install the app: its own prompt, Safari's steps, or not at all (installed, or no way to). */
function installMode(): "install" | "ios" | null {
  if (isStandalone()) return null;
  return deferred ? "install" : isIos() ? "ios" : null;
}

/** Opens the browser's install prompt; true if the app was installed. */
async function promptInstall() {
  const prompt = deferred;
  if (!prompt) return false;
  deferred = null;
  listeners.forEach((l) => l());
  await prompt.prompt();
  const { outcome } = await prompt.userChoice;
  if (outcome === "accepted") save({ installed: true });
  else dismiss();
  return outcome === "accepted";
}

function isIos() {
  // iPadOS reports itself as a Mac, so tell it apart by touch.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Pages with their own panel at the bottom (the adhkār guide, the full-screen mushaf) wait for the next page. */
const BUSY_PAGES = /^\/(adhkar\/|mushaf\/[^/]+\/page\/)/;

function canInvite(pathname: string) {
  if (isStandalone()) return false;
  if (!window.matchMedia("(pointer: coarse)").matches) return false; // phones and tablets only
  const s = saved();
  if (s.installed || s.never || !waited(s)) return false;
  return !BUSY_PAGES.test(pathname);
}

export function InstallPrompt() {
  const { t, isAr } = useLocalize();
  const { pathname } = useLocation();
  const [mode, setMode] = useState<"install" | "ios" | null>(null);
  const [open, setOpen] = useState(false);
  const invited = useRef(false); // once per visit

  useEffect(() => {
    if (invited.current || !canInvite(pathname)) return;
    const invite = () => {
      const m = deferred ? "install" : isIos() ? "ios" : null;
      if (!m || invited.current) return;
      invited.current = true;
      setMode(m);
      setOpen(true);
    };
    // A moment after arriving, so the page shows first; or as soon as the browser says it can install.
    const id = window.setTimeout(invite, 1500);
    listeners.add(invite);
    return () => {
      window.clearTimeout(id);
      listeners.delete(invite);
    };
  }, [pathname]);

  function close() {
    setOpen(false);
    dismiss();
  }

  function never() {
    setOpen(false);
    save({ ...saved(), never: true });
  }

  async function install() {
    if (!deferred) return close();
    await promptInstall();
    setOpen(false);
  }

  if (!mode) return null;
  return (
    <Dialog open={open} onOpenChange={(o) => !o && close()}>
      <DialogContent
        dir={isAr ? "rtl" : "ltr"}
        closeLabel={t("settings.close")}
        // A bottom sheet on phones, a small centred dialog from sm up.
        className="gap-5 max-sm:top-auto max-sm:bottom-0 max-sm:w-full max-sm:max-w-none max-sm:translate-y-0 max-sm:rounded-b-none max-sm:pb-[max(env(safe-area-inset-bottom),1.5rem)] sm:max-w-sm"
      >
        <div className="flex items-center gap-4">
          <img src="/icon-192.png" alt="" className="size-16 shrink-0 rounded-2xl ring-1 ring-border" />
          <DialogHeader className="gap-1 text-start">
            <DialogTitle>{t("install.title", { app: t("appName") })}</DialogTitle>
            <DialogDescription>{t("install.body")}</DialogDescription>
          </DialogHeader>
        </div>

        {mode === "ios" ? (
          <>
            <IosSteps className="rounded-xl border bg-card p-4" />
            <Button onClick={close}>{t("install.gotIt")}</Button>
          </>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" onClick={close}>
              {t("install.later")}
            </Button>
            <Button onClick={install}>{t("install.action")}</Button>
          </div>
        )}
        <button
          type="button"
          onClick={never}
          className="-mt-2 justify-self-center rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
        >
          {t("install.never")}
        </button>
      </DialogContent>
    </Dialog>
  );
}

/** Safari has no install prompt: the two taps of its "Add to Home Screen". */
function IosSteps({ className }: { className?: string }) {
  const { t } = useLocalize();
  return (
    <ol className={cn("space-y-3 text-sm", className)}>
      <li className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <Share className="size-4" />
        </span>
        {t("install.iosShare")}
      </li>
      <li className="flex items-center gap-3">
        <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-primary">
          <SquarePlus className="size-4" />
        </span>
        {t("install.iosAdd")}
      </li>
    </ol>
  );
}

/**
 * Installing from the settings, whenever the browser allows it, even after the invitation was closed
 * (or on a computer, which never gets one). Nothing shows inside the installed app.
 */
export function InstallSection() {
  const { t } = useLocalize();
  const mode = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => listeners.delete(l);
    },
    installMode,
    () => null,
  );
  if (!mode) return null;
  return (
    <section className="space-y-4 rounded-xl border bg-card p-4">
      <div className="flex items-center gap-3">
        <img src="/icon-192.png" alt="" className="size-11 shrink-0 rounded-xl ring-1 ring-border" />
        <div>
          <h3 className="font-medium">{t("install.title", { app: t("appName") })}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-muted-foreground">{t("install.body")}</p>
        </div>
      </div>
      {mode === "install" ? (
        <Button onClick={() => void promptInstall()}>
          <Download />
          {t("install.action")}
        </Button>
      ) : (
        <IosSteps />
      )}
    </section>
  );
}
