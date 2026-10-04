import { cn } from "cn";
import { ChevronLeft } from "lucide-react";
import { Link } from "react-router";
import { useLocalize } from "~/lib/localize";

/**
 * "Back" pill pointing at the page one level up (not browser history, so it still makes
 * sense after Next/Previous lesson or when the page was opened directly). Shows where it goes.
 */
export function BackLink({ to, children, className }: { to: string; children: React.ReactNode; className?: string }) {
  const { t } = useLocalize();
  return (
    <Link
      to={to}
      className={cn(
        "group inline-flex max-w-full items-center gap-1 rounded-full border bg-card/60 py-1.5 ps-2 pe-3.5 text-sm text-muted-foreground backdrop-blur transition-colors hover:bg-accent hover:text-foreground",
        className,
      )}
    >
      <ChevronLeft className="size-4 shrink-0 transition-transform group-hover:-translate-x-0.5 rtl:rotate-180 rtl:group-hover:translate-x-0.5" />
      <span className="sr-only">{t("nav.back")}:</span>
      <span className="truncate">{children}</span>
    </Link>
  );
}
