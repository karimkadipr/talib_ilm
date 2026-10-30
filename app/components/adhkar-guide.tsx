import { cn } from "cn";
import { Pointer } from "lucide-react";
import { useEffect } from "react";
import { Button } from "~/components/ui/button";
import { useLocalize } from "~/lib/localize";

/**
 * First-visit guide on an adhkar page. The page dims and one real card is lifted above the dim
 * (the page gives it `relative z-50`), so the reader learns by doing: tap the first dhikr, watch
 * the page bring the next one, then meet the reorder button.
 *  - "tap":  the first unfinished dhikr; moves on by itself once its count is reached.
 *  - "next": the dhikr the page scrolled to.
 *  - "menu": the page's header, pointing at its ⇅ reorder button.
 */
export type GuideStep = "tap" | "next" | "menu";
export const GUIDE_STEPS: GuideStep[] = ["tap", "next", "menu"];

export function AdhkarGuide({
  step,
  count,
  left,
  onNext,
  onClose,
}: {
  step: GuideStep;
  /** Repetitions of the highlighted dhikr. */
  count: number;
  /** Repetitions still left of it. */
  left: number;
  onNext: () => void;
  onClose: () => void;
}) {
  const { t, num, isAr } = useLocalize();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const title = { tap: t("adhkar.guideTapTitle"), next: t("adhkar.guideNextTitle"), menu: t("adhkar.guideMenuTitle") }[step];
  const body = {
    tap:
      count === 1
        ? t("adhkar.guideTapOnce")
        : `${t("adhkar.guideTapMany", { n: num(count) })} ${left < count ? t("adhkar.left", { left: num(left) }) : ""}`,
    next: count === 1 ? t("adhkar.guideNext") : `${t("adhkar.guideNext")} ${t("adhkar.guideCounter", { n: num(count) })}`,
    menu: t("adhkar.guideMenu"),
  }[step];
  const index = GUIDE_STEPS.indexOf(step);

  return (
    <>
      {/* The dim; it also keeps taps off the other cards while the guide is open. */}
      <div aria-hidden className="fixed inset-0 z-40 bg-black/70 animate-in fade-in" />

      <div
        id="adhkar-guide"
        className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(1rem+env(safe-area-inset-bottom,0px))] lg:start-80"
      >
        <div
          key={step}
          role="dialog"
          aria-labelledby="adhkar-guide-title"
          aria-describedby="adhkar-guide-body"
          dir={isAr ? "rtl" : "ltr"}
          className="tint-border mx-auto max-w-md rounded-2xl border bg-popover p-4 shadow-2xl shadow-black/60 animate-in fade-in slide-in-from-bottom-3"
        >
          <div className="flex items-center justify-between gap-3">
            <p id="adhkar-guide-title" className="font-semibold">
              {title}
            </p>
            <span className="flex gap-1" aria-label={t("adhkar.guideStep", { n: num(index + 1), total: num(GUIDE_STEPS.length) })}>
              {GUIDE_STEPS.map((s, i) => (
                <span
                  key={s}
                  className={cn("h-1.5 rounded-full transition-all", i === index ? "tint-solid w-4" : "w-1.5 bg-white/20")}
                />
              ))}
            </span>
          </div>
          <p id="adhkar-guide-body" aria-live="polite" className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            {body}
          </p>
          <div className="mt-4 flex items-center justify-between gap-3">
            {step === "menu" ? (
              <span />
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="-ms-2 rounded-full px-2 py-1 text-sm text-muted-foreground hover:text-foreground"
              >
                {t("adhkar.guideSkip")}
              </button>
            )}
            {step === "tap" ? (
              <span className="text-xs text-muted-foreground">{t("adhkar.guideTapCue")}</span>
            ) : (
              <Button size="sm" className="rounded-full" onClick={step === "menu" ? onClose : onNext} autoFocus>
                {step === "menu" ? t("adhkar.guideDone") : t("adhkar.guideContinue")}
              </Button>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

/** A tapping finger in the highlighted card's top corner (clear of the text): "tap here". */
export function TapHint() {
  return (
    <span aria-hidden className="pointer-events-none absolute end-3 top-3 z-10 flex size-10 items-center justify-center sm:end-5 sm:top-5">
      <span className="tint-bg absolute inset-0 rounded-full motion-safe:animate-ping" />
      <span className="tint-solid relative flex size-9 items-center justify-center rounded-full text-background shadow-lg shadow-black/40 motion-safe:animate-tap">
        <Pointer className="size-4.5" />
      </span>
    </span>
  );
}
