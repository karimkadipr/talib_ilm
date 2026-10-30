import { ArrowRight, CalendarDays } from "lucide-react";
import { href, Link } from "react-router";
import { CategoryIcon } from "~/components/category-icon";
import { type Category, topCategories } from "~/data/categories";
import { useCategoryStats } from "~/lib/category-stats";
import { useLocalize } from "~/lib/localize";
import { pageMeta } from "~/lib/meta";
import { seo } from "~/lib/meta.server";
import { usePreferences } from "~/lib/preferences";
import type { Route } from "./+types/route";

export async function loader({ context }: Route.LoaderArgs) {
  return { meta: seo(context, []) };
}

export function meta({ loaderData }: Route.MetaArgs) {
  return pageMeta(loaderData?.meta);
}

const card =
  "group tint-border relative flex flex-col overflow-hidden rounded-3xl border bg-card p-6 transition-colors hover:bg-accent/40 sm:p-7 bg-[radial-gradient(120%_120%_at_0%_0%,oklch(0.3_0.06_var(--hue)/0.45),transparent_60%)] rtl:bg-[radial-gradient(120%_120%_at_100%_0%,oklch(0.3_0.06_var(--hue)/0.45),transparent_60%)]";

function CategoryCard({ category }: { category: Category }) {
  const { l, isAr } = useLocalize();
  const stats = useCategoryStats(category);
  return (
    <Link
      to={href("/categories/:categoryId", { categoryId: category.id })}
      style={{ "--hue": category.hue } as React.CSSProperties}
      className={card}
    >
      <span className="tint-bg tint-fg flex size-12 items-center justify-center rounded-2xl">
        <CategoryIcon id={category.id} className="size-6" />
      </span>
      <h2 className="mt-5 text-2xl font-semibold tracking-tight">{l(category.name)}</h2>
      {!isAr && (
        <p lang="ar" className="font-arabic mt-1 text-lg text-muted-foreground">
          {category.name.ar}
        </p>
      )}
      <p className="mt-3 flex-1 text-sm leading-relaxed text-muted-foreground">{l(category.description)}</p>
      <p className="mt-6 flex items-center justify-between gap-3 text-xs text-muted-foreground">
        <span className="tabular-nums">{stats.join(" · ")}</span>
        <ArrowRight className="tint-fg size-4 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
      </p>
    </Link>
  );
}

export default function Home() {
  const { t } = useLocalize();
  const { programme } = usePreferences();

  return (
    <div className="space-y-4">
      {/* The page opens straight on the sections; the heading is for screen readers. */}
      <h1 className="sr-only">{t("appName")}</h1>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {topCategories.map((category) => (
          <CategoryCard key={category.id} category={category} />
        ))}
      </div>

      {programme && (
        <Link
          to={href("/program")}
          style={{ "--hue": 30 } as React.CSSProperties}
          className="group tint-border flex items-center gap-4 rounded-3xl border bg-card p-5 transition-colors hover:bg-accent/40 sm:p-6"
        >
          <span className="tint-bg tint-fg flex size-12 shrink-0 items-center justify-center rounded-2xl">
            <CalendarDays className="size-6" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block font-semibold">{t("programme.toggle")}</span>
            <span className="mt-1 block text-sm leading-relaxed text-muted-foreground">{t("home.programDesc")}</span>
          </span>
          <ArrowRight className="tint-fg size-4 shrink-0 transition-transform group-hover:translate-x-0.5 rtl:-scale-x-100 rtl:group-hover:-translate-x-0.5" />
        </Link>
      )}
    </div>
  );
}
