import { cn } from "cn";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "~/components/ui/dialog";
import type { Grading } from "~/data/adhkar";
import { useLocalize } from "~/lib/localize";

const VERDICT_CLASS: Record<Grading["verdict"], string> = {
  sahih: "bg-primary/15 text-primary",
  disputed: "bg-gold/15 text-gold",
  daif: "bg-destructive/15 text-destructive",
};

/** A dhikr's source and the scholars' rulings on it, opened from the source button on its card. */
export function DhikrGrading({
  grading,
  open,
  onOpenChange,
}: {
  grading: Grading | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { l, t, isAr } = useLocalize();
  if (!grading) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent dir={isAr ? "rtl" : "ltr"} closeLabel={t("settings.close")} className="gap-5 sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{t("grading.title")}</DialogTitle>
          <DialogDescription className="flex flex-wrap items-center gap-2">
            <span className={cn("rounded-md px-2 py-0.5 text-xs font-semibold", VERDICT_CLASS[grading.verdict])}>
              {t(`grading.${grading.verdict}`)}
            </span>
            {t(`grading.${grading.verdict}Hint`)}
          </DialogDescription>
        </DialogHeader>

        <p lang="ar" dir="rtl" className="font-adhkar text-lg leading-loose text-foreground">
          {grading.takhrij}
        </p>
        <p className="text-sm leading-relaxed text-foreground/90">{l(grading.reason)}</p>

        <section className="space-y-2">
          <h3 className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{t("grading.rulings")}</h3>
          <dl className="space-y-1.5 text-sm">
            {grading.rulings.map((r, i) => (
              <div key={i} className="grid gap-x-3 sm:grid-cols-[9rem_1fr]">
                <dt className="text-muted-foreground">{l(r.who)}</dt>
                <dd>{l(r.ruling)}</dd>
              </div>
            ))}
          </dl>
        </section>

        {grading.notes && (
          <section className="space-y-2 rounded-xl border border-gold/30 bg-gold/5 p-3">
            <h3 className="text-xs font-medium tracking-wide text-gold uppercase">{t("grading.notes")}</h3>
            <ul className="space-y-1 text-sm leading-relaxed">
              {grading.notes.map((n, i) => (
                <li key={i}>{l(n)}</li>
              ))}
            </ul>
          </section>
        )}

        <p className="text-xs leading-relaxed text-muted-foreground">{t("grading.disclaimer")}</p>
      </DialogContent>
    </Dialog>
  );
}
