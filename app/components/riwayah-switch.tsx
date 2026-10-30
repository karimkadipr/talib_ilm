import { cn } from "cn";
import { Link } from "react-router";
import { type MushafId, mushafs } from "~/data/mushafs";
import { useLocalize } from "~/lib/localize";
import { chooseRiwayah } from "~/lib/riwayah";

/** A small Ḥafṣ | Warsh switch for a section's header; the choice is remembered for next time. */
export function RiwayahSwitch({ current, to }: { current: MushafId; to: (id: MushafId) => string }) {
  const { l, t } = useLocalize();
  return (
    <nav aria-label={t("mushaf.riwayah")} className="flex shrink-0 rounded-full border bg-background/40 p-0.5 text-xs">
      {mushafs.map((m) => (
        <Link
          key={m.id}
          to={to(m.id)}
          replace
          onClick={() => chooseRiwayah(m.id)}
          aria-current={m.id === current ? "page" : undefined}
          title={l(m.name)}
          className={cn(
            "rounded-full px-3 py-1 transition-colors",
            m.id === current ? "bg-accent text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {l(m.short)}
        </Link>
      ))}
    </nav>
  );
}
