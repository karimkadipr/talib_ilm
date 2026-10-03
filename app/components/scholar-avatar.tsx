import { cn } from "cn";
import type { Scholar } from "~/data/explanations";

/** Monogram from the family name (last word), e.g. العثيمين → ع, آل الشيخ → ش. */
function monogram(name: string) {
  const last = name.trim().split(/\s+/).pop() ?? name;
  return last.replace(/^ال/, "").charAt(0);
}

export function ScholarAvatar({
  scholar,
  className,
}: {
  scholar: Scholar;
  className?: string;
}) {
  return (
    <span
      aria-hidden
      style={{ "--hue": scholar.hue } as React.CSSProperties}
      className={cn(
        "font-arabic inline-flex size-10 shrink-0 items-center justify-center rounded-full text-lg ring-2 ring-background",
        "bg-[oklch(0.3_0.06_var(--hue))] text-[oklch(0.9_0.08_var(--hue))]",
        className,
      )}
    >
      {monogram(scholar.name.ar)}
    </span>
  );
}
