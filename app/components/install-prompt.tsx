import { Share, SquarePlus } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";
import { Button } from "~/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import { useLocalize } from "~/lib/localize";

// Invites phone visitors to install the app (home-screen icon, full screen). Chromium browsers hand us
// their install prompt (beforeinstallprompt) to open from our own button; iOS has none, so there we
// show the two taps of Safari's "Add to Home Screen". Never shown inside the installed app, and once
// closed it stays away for a while.

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const KEY = "islamic-studies:install-prompt:v1";
const QUIET_DAYS = 14;

type Saved = { dismissedAt?: number; installed?: boolean };

function saved(): Saved {
  try {
    return JSON.parse(window.localStorage.getItem(KEY) ?? "{}");
  } catch {
    return {};
  }
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
  });
}

function isIos() {
  // iPadOS reports itself as a Mac, so tell it apart by touch.
  return /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
}

/** Pages with their own panel at the bottom (the adhkār guide, the full-screen mushaf) wait for the next page. */
const BUSY_PAGES = /^\/(adhkar\/|mushaf\/[^/]+\/page\/)/;

function canInvite(pathname: string) {
  if (window.matchMedia("(display-mode: standalone)").matches || (navigator as { standalone?: boolean }).standalone)
    return false;
  if (!window.matchMedia("(pointer: coarse)").matches) return false; // phones and tablets only
  const s = saved();
  if (s.installed || (s.dismissedAt && Date.now() - s.dismissedAt < QUIET_DAYS * 864e5)) return false;
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
    save({ ...saved(), dismissedAt: Date.now() });
  }

  async function install() {
    const prompt = deferred;
    if (!prompt) return close();
    deferred = null;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    setOpen(false);
    save(outcome === "accepted" ? { installed: true } : { ...saved(), dismissedAt: Date.now() });
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
            <ol className="space-y-3 rounded-xl border bg-card p-4 text-sm">
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
      </DialogContent>
    </Dialog>
  );
}
