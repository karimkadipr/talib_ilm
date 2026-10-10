import { cn } from "cn";
import { useId } from "react";
import { Switch } from "~/components/ui/switch";
import { useLocalize } from "~/lib/localize";
import { usePreferences, useSetProgramme } from "~/lib/preferences";

/** Turns the weekly programme (Programme and Today pages) on or off. */
export function ProgrammeToggle({ className, hint = true }: { className?: string; hint?: boolean }) {
  const { t } = useLocalize();
  const { programme } = usePreferences();
  const setProgramme = useSetProgramme();
  const id = useId();
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <label htmlFor={id} className="min-w-0 cursor-pointer">
        <span className="block text-sm font-medium text-foreground">{t("programme.toggle")}</span>
        {hint && <span className="mt-0.5 block text-xs text-muted-foreground">{t("programme.toggleHint")}</span>}
      </label>
      <Switch id={id} checked={programme} onCheckedChange={setProgramme} className="mt-0.5" />
    </div>
  );
}
